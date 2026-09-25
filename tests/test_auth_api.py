import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_signup_login_me_and_scrape_endpoints(client: AsyncClient):
    # 1. Signup
    signup_payload = {
        "name": "Alex Smith",
        "email": "alex.smith@college.edu",
        "password": "Password123!",
        "college_url": "https://apex-tech.edu",
        "course": "B.Tech",
        "branch": "Computer Science",
        "semester": 5,
    }
    resp = await client.post("/auth/signup", json=signup_payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "access_token" in data
    token = data["access_token"]

    # 2. Duplicate signup should succeed or return 409
    dup_resp = await client.post("/auth/signup", json=signup_payload)
    assert dup_resp.status_code in (200, 201, 409)

    # 3. Login
    login_payload = {
        "email": "alex.smith@college.edu",
        "password": "Password123!",
    }
    login_resp = await client.post("/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # 4. Login with wrong password should return 401
    bad_login = await client.post(
        "/auth/login",
        json={"email": "alex.smith@college.edu", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # 5. Get current profile /auth/me
    me_resp = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "alex.smith@college.edu"
    assert me_data["name"] == "Alex Smith"
    college_id = me_data["college_id"]

    # 5b. Update profile via PATCH /auth/me
    patch_resp = await client.patch(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Alex Updated",
            "branch": "IT",
            "semester": 6,
        },
    )
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()
    assert patch_data["name"] == "Alex Updated"
    assert patch_data["branch"] == "IT"
    assert patch_data["semester"] == 6

    # 6. Scrape status endpoint
    status_resp = await client.get(f"/colleges/{college_id}/scrape-status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["college_id"] == college_id
    assert status_data["base_url"] == "https://apex-tech.edu"
    assert "total_pages_scraped" in status_data

    # 7. Trigger scrape endpoint
    trigger_resp = await client.post(f"/colleges/{college_id}/trigger-scrape")
    assert trigger_resp.status_code == 202
    assert trigger_resp.json()["status"] == "running"
