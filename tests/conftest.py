import pytest
from httpx import ASGITransport, AsyncClient

from app.db import async_session_factory, engine
from app.main import app
from app.models.base import Base


@pytest.fixture(autouse=True)
async def setup_database():
    """Ensure database schema is created before each test and cleaned up after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session():
    async with async_session_factory() as session:
        yield session


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
