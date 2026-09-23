import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_student
from app.db import get_db
from app.models.notice import Notice, NotificationLog
from app.models.student import Student
from app.services.notification_service import dispatch_notice_alerts

router = APIRouter(tags=["Notifications"])


class StudentNotificationItem(BaseModel):
    id: uuid.UUID
    notice_id: uuid.UUID
    notice_title: str
    notice_content: str | None
    sent_at: datetime
    delivery_status: str

    model_config = {"from_attributes": True}


class NotificationPreferencesUpdate(BaseModel):
    email_notifications_enabled: bool = Field(
        ...,
        description="Whether the student wishes to receive email alerts for new relevant notices.",
    )


class NotificationPreferencesResponse(BaseModel):
    message: str
    email_notifications_enabled: bool


class TriggerNoticeAlertResponse(BaseModel):
    message: str
    notice_id: uuid.UUID
    status: str


@router.get("/notifications/me", response_model=list[StudentNotificationItem])
async def get_my_notifications(
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all notice alerts and delivery records sent to the logged-in student."""
    stmt = (
        select(NotificationLog)
        .options(selectinload(NotificationLog.notice))
        .where(NotificationLog.student_id == current_student.id)
        .order_by(NotificationLog.sent_at.desc())
    )
    logs = (await db.execute(stmt)).scalars().all()

    items = []
    for log in logs:
        items.append(
            StudentNotificationItem(
                id=log.id,
                notice_id=log.notice_id,
                notice_title=log.notice.title if log.notice else "Notice",
                notice_content=log.notice.content if log.notice else None,
                sent_at=log.sent_at,
                delivery_status=log.delivery_status,
            )
        )
    return items


@router.patch("/notifications/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    body: NotificationPreferencesUpdate,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    """Toggle email notifications on or off for the current student account."""
    current_student.email_notifications_enabled = body.email_notifications_enabled
    await db.commit()
    await db.refresh(current_student)

    status_str = "enabled" if current_student.email_notifications_enabled else "disabled"
    return NotificationPreferencesResponse(
        message=f"Email notifications have been {status_str}.",
        email_notifications_enabled=current_student.email_notifications_enabled,
    )


@router.post(
    "/notices/{notice_id}/send-alerts",
    response_model=TriggerNoticeAlertResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_notice_alerts(
    notice_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Manually dispatch email alerts for a specific notice to all matching students.
    Runs asynchronously in the background.
    """
    notice = await db.get(Notice, notice_id)
    if not notice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notice with id {notice_id} not found",
        )

    background_tasks.add_task(dispatch_notice_alerts, notice.id)

    return TriggerNoticeAlertResponse(
        message="Notice alert dispatch task has been queued",
        notice_id=notice.id,
        status="dispatch_queued",
    )
