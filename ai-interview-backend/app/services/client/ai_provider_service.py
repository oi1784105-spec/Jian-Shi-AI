from __future__ import annotations

import logging
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.credential_cipher import CredentialCipher
from app.exceptions.http_exceptions import NotFoundError, ValidationError
from app.models.ai_provider import AIProvider
from app.models.interview import Interview
from app.schemas.client.ai_provider import AIProviderCreate, AIProviderUpdate
from app.services.client.ai_provider_runtime import (
    AIProviderRuntime,
    PROVIDER_PRESETS,
    ProviderRuntimeConfig,
    discover_models,
    get_preset,
    normalize_base_url,
    normalize_models,
    safe_provider_error,
)

logger = logging.getLogger(__name__)


class AIProviderService:
    @staticmethod
    def presets() -> list[dict]:
        return [
            {
                "key": key,
                "label": preset["label"],
                "protocol": preset["protocol"],
                "default_base_url": preset["base_url"],
                "website_url": preset["website_url"],
                "default_models": preset["models"],
                "supports_model_discovery": bool(preset["discovery"]),
                "requires_custom_endpoint": not bool(preset["base_url"]),
            }
            for key, preset in PROVIDER_PRESETS.items()
        ]

    @staticmethod
    def serialize(provider: AIProvider) -> dict:
        return {
            "id": provider.id,
            "identifier": provider.identifier,
            "provider": provider.provider,
            "protocol": provider.protocol,
            "name": provider.name,
            "note": provider.note,
            "website_url": provider.website_url,
            "base_url": provider.base_url,
            "api_key_masked": f"•••• {provider.api_key_hint}",
            "models": provider.models or [],
            "default_model": provider.default_model,
            "api_version": provider.api_version,
            "is_active": provider.is_active,
            "is_validated": provider.is_validated,
            "last_tested_at": provider.last_tested_at,
            "created_at": provider.created_at,
            "updated_at": provider.updated_at,
        }

    @staticmethod
    async def _owned(db: AsyncSession, user_id: int, provider_id: int) -> AIProvider:
        result = await db.execute(
            select(AIProvider).where(AIProvider.id == provider_id, AIProvider.user_id == user_id)
        )
        provider = result.scalar_one_or_none()
        if not provider:
            raise NotFoundError(message="API 供应商配置不存在")
        return provider

    @staticmethod
    async def list(db: AsyncSession, user_id: int) -> list[dict]:
        result = await db.execute(
            select(AIProvider).where(AIProvider.user_id == user_id).order_by(AIProvider.is_active.desc(), AIProvider.created_at.desc())
        )
        return [AIProviderService.serialize(item) for item in result.scalars().all()]

    @staticmethod
    async def status(db: AsyncSession, user_id: int) -> dict:
        result = await db.execute(
            select(AIProvider).where(
                AIProvider.user_id == user_id,
                AIProvider.is_active.is_(True),
                AIProvider.is_validated.is_(True),
            )
        )
        provider = result.scalar_one_or_none()
        return {
            "configured": provider is not None,
            "active_provider": AIProviderService.serialize(provider) if provider else None,
        }

    @staticmethod
    async def create(db: AsyncSession, user_id: int, data: AIProviderCreate) -> dict:
        get_preset(data.provider)
        if not data.api_key.strip():
            raise ValidationError(message="请填写 API Key")
        existing = await db.scalar(
            select(AIProvider.id).where(AIProvider.user_id == user_id, AIProvider.identifier == data.identifier)
        )
        if existing:
            raise ValidationError(message="供应商标识已存在")
        preset = get_preset(data.provider)
        base_url = normalize_base_url(data.provider, data.base_url)
        models = normalize_models(data.models or preset["models"], data.default_model)
        provider = AIProvider(
            user_id=user_id,
            identifier=data.identifier,
            provider=data.provider,
            protocol=preset["protocol"],
            name=data.name.strip(),
            note=data.note.strip() if data.note else None,
            website_url=data.website_url.strip() if data.website_url else preset["website_url"] or None,
            base_url=base_url,
            encrypted_api_key=CredentialCipher.encrypt(data.api_key),
            api_key_hint=CredentialCipher.key_hint(data.api_key),
            models=models,
            default_model=data.default_model.strip(),
            api_version=data.api_version.strip() if data.api_version else None,
            is_active=False,
            is_validated=False,
        )
        db.add(provider)
        await db.commit()
        await db.refresh(provider)
        return AIProviderService.serialize(provider)

    @staticmethod
    async def update(db: AsyncSession, user_id: int, provider_id: int, data: AIProviderUpdate) -> dict:
        provider = await AIProviderService._owned(db, user_id, provider_id)
        values = data.model_dump(exclude_unset=True)
        connection_fields = {"provider", "base_url", "api_key", "default_model", "api_version"}
        connection_changed = bool(connection_fields.intersection(values))

        if "provider" in values:
            preset = get_preset(values["provider"])
            provider.provider = values["provider"]
            provider.protocol = preset["protocol"]
        else:
            preset = get_preset(provider.provider)
        if "identifier" in values:
            duplicate = await db.scalar(
                select(AIProvider.id).where(
                    AIProvider.user_id == user_id,
                    AIProvider.identifier == values["identifier"],
                    AIProvider.id != provider_id,
                )
            )
            if duplicate:
                raise ValidationError(message="供应商标识已存在")
            provider.identifier = values["identifier"]
        for field in ("name", "note", "website_url", "api_version"):
            if field in values:
                value = values[field]
                setattr(provider, field, value.strip() if isinstance(value, str) and value else value)
        if "base_url" in values or "provider" in values:
            provider.base_url = normalize_base_url(provider.provider, values.get("base_url", provider.base_url))
        if values.get("api_key") is not None:
            if not values["api_key"].strip():
                raise ValidationError(message="API Key 不能为空")
            provider.encrypted_api_key = CredentialCipher.encrypt(values["api_key"])
            provider.api_key_hint = CredentialCipher.key_hint(values["api_key"])
        if "default_model" in values:
            provider.default_model = values["default_model"].strip()
        if "models" in values:
            provider.models = normalize_models(values["models"] or preset["models"], provider.default_model)
        elif "default_model" in values and provider.default_model not in (provider.models or []):
            provider.models = [*(provider.models or []), provider.default_model]

        if connection_changed:
            provider.is_validated = False
            provider.is_active = False
            provider.last_tested_at = None
        await db.commit()
        await db.refresh(provider)
        return AIProviderService.serialize(provider)

    @staticmethod
    async def delete(db: AsyncSession, user_id: int, provider_id: int) -> None:
        provider = await AIProviderService._owned(db, user_id, provider_id)
        in_progress = await db.scalar(
            select(Interview.id).where(
                Interview.user_id == user_id,
                Interview.ai_provider_id == provider_id,
                Interview.status == "in_progress",
            ).limit(1)
        )
        if in_progress:
            raise ValidationError(message="该配置正被进行中的面试使用，暂时不能删除")
        await db.delete(provider)
        await db.commit()

    @staticmethod
    def runtime(provider: AIProvider, model: str | None = None) -> AIProviderRuntime:
        return AIProviderRuntime(ProviderRuntimeConfig(
            provider=provider.provider,
            base_url=provider.base_url,
            api_key=CredentialCipher.decrypt(provider.encrypted_api_key),
            model=model or provider.default_model,
            api_version=provider.api_version,
        ))

    @staticmethod
    async def test(db: AsyncSession, user_id: int, provider_id: int) -> dict:
        provider = await AIProviderService._owned(db, user_id, provider_id)
        try:
            await AIProviderService.runtime(provider).test_connection()
        except ValidationError:
            raise
        except Exception as exc:
            provider.is_validated = False
            provider.is_active = False
            provider.last_tested_at = datetime.now(UTC)
            await db.commit()
            logger.warning("Provider connection test failed provider=%s error_type=%s", provider.provider, type(exc).__name__)
            raise ValidationError(message=safe_provider_error(exc)) from None
        provider.is_validated = True
        provider.last_tested_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(provider)
        return AIProviderService.serialize(provider)

    @staticmethod
    async def activate(db: AsyncSession, user_id: int, provider_id: int) -> dict:
        provider = await AIProviderService._owned(db, user_id, provider_id)
        if not provider.is_validated:
            raise ValidationError(message="请先测试并验证该供应商配置")
        await db.execute(
            update(AIProvider).where(AIProvider.user_id == user_id).values(is_active=False)
        )
        provider.is_active = True
        await db.commit()
        await db.refresh(provider)
        return AIProviderService.serialize(provider)

    @staticmethod
    async def active(db: AsyncSession, user_id: int) -> AIProvider:
        result = await db.execute(
            select(AIProvider).where(
                AIProvider.user_id == user_id,
                AIProvider.is_active.is_(True),
                AIProvider.is_validated.is_(True),
            )
        )
        provider = result.scalar_one_or_none()
        if not provider:
            raise ValidationError(message="请先配置、测试并启用个人 API")
        return provider

    @staticmethod
    async def models(db: AsyncSession, user_id: int, provider_id: int) -> list[str]:
        provider = await AIProviderService._owned(db, user_id, provider_id)
        values = await discover_models(
            provider.provider,
            provider.base_url,
            CredentialCipher.decrypt(provider.encrypted_api_key),
            provider.api_version,
        )
        if values:
            provider.models = normalize_models(values, provider.default_model)
            await db.commit()
        return values


ai_provider_service = AIProviderService()
