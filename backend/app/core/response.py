from datetime import datetime, timezone
from typing import Any, Optional
from app.schemas.common import APIResponse


def ok(data: Any = None, message: Optional[str] = None) -> dict:
    """
    Returns a standardized dictionary payload adhering to the APIResponse schema.
    """
    return {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
