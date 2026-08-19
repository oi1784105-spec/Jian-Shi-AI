from ..base import BaseSchema, BaseResponseSchema
from pydantic import Field
from datetime import datetime
from typing import Optional


class Login(BaseSchema):
    # Local deployments use the reserved .local domain for the initial admin.
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1)


class Token(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshToken(BaseSchema):
    refresh_token: str


class Logout(BaseSchema):
    refresh_token: str


class AdminInfo(BaseResponseSchema):
    id: int
    role: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
