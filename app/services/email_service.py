import abc
import logging
import uuid

import httpx

from app.core.config import get_settings

logger = logging.getLogger("email_service")
settings = get_settings()


class BaseEmailService(abc.ABC):
    """Abstract interface for sending transactional emails to students."""

    @abc.abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> str:
        """Send an email and return the provider's message identifier."""
        pass


class MockConsoleEmailService(BaseEmailService):
    """Mock email service for development and testing without live API keys."""

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> str:
        msg_id = f"mock_msg_{uuid.uuid4().hex[:12]}"
        logger.info(
            "\n========== [MOCK EMAIL SENT] ==========\n"
            "To: %s\n"
            "Subject: %s\n"
            "Provider Message ID: %s\n"
            "Plaintext Body:\n%s\n"
            "========================================",
            to_email,
            subject,
            msg_id,
            text_content,
        )
        return msg_id


class ResendEmailService(BaseEmailService):
    """Production email service via Resend API."""

    def __init__(self, api_key: str | None = None, from_email: str | None = None):
        self.api_key = api_key or settings.RESEND_API_KEY
        self.from_email = from_email or settings.EMAIL_FROM
        self.endpoint = "https://api.resend.com/emails"

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> str:
        # TODO: replace with real Resend API call if using official resend-python SDK
        if not self.api_key or self.api_key.startswith("re_your_"):
            logger.warning("Resend API key not configured. Falling back to console log.")
            return await MockConsoleEmailService().send_email(
                to_email, subject, html_content, text_content
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(self.endpoint, json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.error("Resend API failed [%d]: %s", resp.status_code, resp.text)
                raise RuntimeError(f"Failed to send email via Resend: {resp.text}")

            data = resp.json()
            message_id = data.get("id", f"resend_{uuid.uuid4().hex[:8]}")
            logger.info("Email delivered via Resend API: message_id=%s", message_id)
            return message_id


def build_notice_email(
    student_name: str,
    notice_title: str,
    notice_content: str,
    college_name: str,
) -> tuple[str, str]:
    """Generate professional HTML and plaintext email bodies for a notice alert."""
    subject_title = notice_title.strip()
    safe_content = notice_content.strip() or "No additional description was provided."

    text_body = f"""Hello {student_name},

A new official notice relevant to your course has been detected from {college_name}:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{subject_title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
{safe_content}

Visit your student dashboard on ExamBuddy for full curriculum details and previous year exam questions.

Best regards,
The ExamBuddy Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject_title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 24px; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; }}
    .badge {{ display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px; font-size: 12px; margin-top: 8px; font-weight: 500; }}
    .content {{ padding: 28px 24px; }}
    .notice-card {{ background: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 18px; margin: 20px 0; }}
    .notice-title {{ font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 10px 0; }}
    .notice-desc {{ font-size: 14px; line-height: 1.6; color: #334155; margin: 0; white-space: pre-line; }}
    .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New College Notice Alert</h1>
      <span class="badge">{college_name}</span>
    </div>
    <div class="content">
      <p>Hello <strong>{student_name}</strong>,</p>
      <p>ExamBuddy detected a new official notification that matches your course and semester:</p>
      <div class="notice-card">
        <h2 class="notice-title">{subject_title}</h2>
        <p class="notice-desc">{safe_content}</p>
      </div>
      <p>Log in to your ExamBuddy student portal to review the full details and exam preparation resources.</p>
    </div>
    <div class="footer">
      <p>You received this because email notifications are enabled for your ExamBuddy account.</p>
    </div>
  </div>
</body>
</html>"""

    return html_body, text_body


# Service singleton
def get_email_service() -> BaseEmailService:
    if settings.EMAIL_BACKEND == "resend" or (
        settings.RESEND_API_KEY
        and not settings.RESEND_API_KEY.startswith("re_your_")
    ):
        return ResendEmailService()
    return MockConsoleEmailService()


email_service = get_email_service()
