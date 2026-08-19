from typing import Optional

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


class AIProviderCreate(BaseSchema):
    identifier: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    provider: str = Field(min_length=2, max_length=40)
    name: str = Field(min_length=1, max_length=100)
    note: Optional[str] = Field(default=None, max_length=255)
    website_url: Optional[str] = Field(default=None, max_length=500)
    base_url: Optional[str] = Field(default=None, max_length=500)
    api_key: str
    models: list[str] = Field(default_factory=list, max_length=50)
    default_model: str = Field(min_length=1, max_length=200)
    api_version: Optional[str] = Field(default=None, max_length=40)

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: str) -> str:
        return value.strip().lower()


class AIProviderUpdate(BaseSchema):
    identifier: Optional[str] = Field(default=None, min_length=2, max_length=64, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    provider: Optional[str] = Field(default=None, min_length=2, max_length=40)
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    note: Optional[str] = Field(default=None, max_length=255)
    website_url: Optional[str] = Field(default=None, max_length=500)
    base_url: Optional[str] = Field(default=None, max_length=500)
    api_key: Optional[str] = None
    models: Optional[list[str]] = Field(default=None, max_length=50)
    default_model: Optional[str] = Field(default=None, min_length=1, max_length=200)
    api_version: Optional[str] = Field(default=None, max_length=40)

    @field_validator("identifier")
    @classmethod
    def normalize_identifier(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().lower() if value is not None else None


class AIProviderDiscoveryRequest(BaseSchema):
    provider: str = Field(min_length=2, max_length=40)
    base_url: Optional[str] = Field(default=None, max_length=500)
    api_key: str
    api_version: Optional[str] = Field(default=None, max_length=40)

