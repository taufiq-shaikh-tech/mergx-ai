import logging
from typing import Optional
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.schemas.auth import UserIdentity

logger = logging.getLogger(__name__)

security_scheme = HTTPBearer(auto_error=False)


async def verify_supabase_token(token: str) -> UserIdentity:
    """
    Verifies a Supabase JWT token either via local JWT secret verification
    or by querying Supabase Auth endpoint (GET /auth/v1/user).
    Derives the authenticated user identity directly from the verified token.
    Never trusts a user ID passed in a request body or URL.
    """
    # Fast path: Local developer token during development
    if settings.DEBUG and token in ("dev-token", "dev-preview-token", "mock-token", "mock-valid-jwt-token"):
        return UserIdentity(
            id="usr_dev_local",
            email="developer@mergex.ai",
            role="authenticated",
            user_metadata={"name": "Developer (Local Preview)"},
        )

    # 1. Check if Supabase configuration is present
    if not settings.is_supabase_configured and not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Supabase authentication is not configured on the backend. "
                "Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your backend .env file."
            ),
        )

    # 2. Strategy A: Local JWT Secret verification if SUPABASE_JWT_SECRET is configured
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token is missing subject (sub) claim.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            return UserIdentity(
                id=user_id,
                email=payload.get("email"),
                role=payload.get("role", "authenticated"),
                user_metadata=payload.get("user_metadata", {}),
                app_metadata=payload.get("app_metadata", {}),
            )
        except jwt.PyJWTError as e:
            logger.warning("Local Supabase JWT verification failed: %s", str(e))
            # Fall through to Supabase API verification if SUPABASE_URL is available,
            # or raise 401 if only JWT secret was relied upon.
            if not settings.is_supabase_configured:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # 3. Strategy B: Verify against Supabase Auth API
    supabase_auth_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    api_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY

    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(supabase_auth_url, headers=headers)

            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid user profile returned by Supabase Auth.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

                return UserIdentity(
                    id=user_id,
                    email=user_data.get("email"),
                    role=user_data.get("role", "authenticated"),
                    user_metadata=user_data.get("user_metadata") or {},
                    app_metadata=user_data.get("app_metadata") or {},
                )
            elif response.status_code in (400, 401, 403):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid, expired or revoked Supabase authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                logger.error(
                    "Unexpected status from Supabase Auth service: %d %s",
                    response.status_code,
                    response.text,
                )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Unexpected response from Supabase Auth service.",
                )
    except httpx.RequestError as exc:
        logger.error("Network error contacting Supabase Auth at %s: %s", supabase_auth_url, str(exc))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Supabase Auth service to verify token.",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> UserIdentity:
    """
    FastAPI dependency that enforces authentication.
    Extracts Bearer token from the Authorization header and verifies it with Supabase.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials. Include 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await verify_supabase_token(credentials.credentials)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Optional[UserIdentity]:
    """
    Optional user dependency. Returns None if unauthenticated, or UserIdentity if valid.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        return await verify_supabase_token(credentials.credentials)
    except HTTPException:
        return None
