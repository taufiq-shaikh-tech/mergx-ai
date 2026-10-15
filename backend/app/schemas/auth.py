from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UserIdentity(BaseModel):
    """
    Authenticated user identity derived directly from a validated Supabase access token.
    Never trust user identifiers supplied in client request bodies.
    """
    id: str = Field(..., description="Supabase UUID for the user (sub claim)")
    email: Optional[str] = Field(None, description="User email address")
    role: Optional[str] = Field("authenticated", description="Supabase user role")
    user_metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata stored on the Supabase user profile")
    app_metadata: Dict[str, Any] = Field(default_factory=dict, description="App metadata / providers")
