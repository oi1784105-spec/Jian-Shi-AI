from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .base import BaseModel


class AIProvider(BaseModel):
    __tablename__ = "ai_provider_configs"
    __table_args__ = (
        UniqueConstraint("user_id", "identifier", name="uq_ai_provider_user_identifier"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    identifier = Column(String(64), nullable=False)
    provider = Column(String(40), nullable=False)
    protocol = Column(String(40), nullable=False)
    name = Column(String(100), nullable=False)
    note = Column(String(255), nullable=True)
    website_url = Column(String(500), nullable=True)
    base_url = Column(String(500), nullable=True)
    encrypted_api_key = Column(Text, nullable=False)
    api_key_hint = Column(String(8), nullable=False)
    models = Column(JSONB, nullable=False, default=list)
    default_model = Column(String(200), nullable=False)
    api_version = Column(String(40), nullable=True)
    is_active = Column(Boolean, nullable=False, default=False)
    is_validated = Column(Boolean, nullable=False, default=False)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="ai_providers")
    interviews = relationship("Interview", back_populates="ai_provider")
