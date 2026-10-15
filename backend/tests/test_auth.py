from unittest.mock import AsyncMock, patch
import pytest
from app.schemas.auth import UserIdentity


def test_protected_endpoint_rejects_missing_token(client):
    """
    Test protected endpoints return 401 when Authorization header is absent.
    """
    response = client.get("/api/v1/projects")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "Missing authentication" in data["error"]["message"]


def test_protected_endpoint_rejects_malformed_token(client):
    """
    Test protected endpoints return 401 with invalid Bearer token.
    """
    headers = {"Authorization": "Bearer not-a-valid-token-at-all"}
    response = client.get("/api/v1/projects", headers=headers)
    assert response.status_code in (401, 502)
    data = response.json()
    assert data["success"] is False


@pytest.mark.asyncio
async def test_auth_dependency_with_mocked_verified_token(client):
    """
    Test that verified token supplies the UserIdentity to protected route.
    """
    mock_user = UserIdentity(
        id="usr_supabase_12345",
        email="developer@mergex.ai",
        role="authenticated",
        user_metadata={"name": "Dev Lead"},
    )

    with patch("app.core.security.verify_supabase_token", new=AsyncMock(return_value=mock_user)):
        headers = {"Authorization": "Bearer mock-valid-jwt-token"}
        response = client.get("/api/v1/projects", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
