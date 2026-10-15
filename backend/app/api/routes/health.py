from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.core.response import ok
from app.schemas.common import HealthResponse, HealthServicesStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Service Health Check",
    description="Returns API service health, version, running environment, and external service configuration status.",
)
async def check_health():
    payload = HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc),
        services=HealthServicesStatus(
            supabase_configured=settings.is_supabase_configured,
            database_configured=bool(settings.DATABASE_URL),
            environment=settings.ENVIRONMENT,
        ),
    )
    return ok(data=payload.model_dump())
