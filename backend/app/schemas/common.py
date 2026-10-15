from datetime import datetime, timezone
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error explanation")
    details: Optional[Any] = Field(None, description="Detailed error attributes or validation issues")


class APIResponse(BaseModel, Generic[DataT]):
    success: bool = Field(True, description="Indicates whether the operation was successful")
    data: Optional[DataT] = Field(None, description="Response payload")
    message: Optional[str] = Field(None, description="Optional informational message")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the response",
    )


class HealthServicesStatus(BaseModel):
    supabase_configured: bool = Field(..., description="Whether Supabase client is configured")
    database_configured: bool = Field(..., description="Whether persistent database URL is configured")
    environment: str = Field(..., description="Current running environment")


class HealthResponse(BaseModel):
    status: str = Field("healthy", description="Application health status")
    version: str = Field("1.0.0", description="API version")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC check timestamp",
    )
    services: HealthServicesStatus = Field(..., description="Status of connected services")
