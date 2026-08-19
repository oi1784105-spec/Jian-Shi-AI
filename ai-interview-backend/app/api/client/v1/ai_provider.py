from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.client.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.client.ai_provider import AIProviderCreate, AIProviderDiscoveryRequest, AIProviderUpdate
from app.schemas.response import ApiResponse
from app.services.client.ai_provider_runtime import discover_models
from app.services.client.ai_provider_service import ai_provider_service

router = APIRouter()


@router.get("/presets")
async def get_presets(current_user: User = Depends(get_current_user)):
    return ApiResponse.success(data=ai_provider_service.presets())


@router.post("/discover-models")
async def discover_provider_models(data: AIProviderDiscoveryRequest, current_user: User = Depends(get_current_user)):
    models = await discover_models(data.provider, data.base_url, data.api_key, data.api_version)
    return ApiResponse.success(data={"models": models})


@router.get("/status")
async def get_status(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data=await ai_provider_service.status(db, current_user.id))


@router.get("")
async def list_providers(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data=await ai_provider_service.list(db, current_user.id))


@router.post("")
async def create_provider(data: AIProviderCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data=await ai_provider_service.create(db, current_user.id, data))


@router.put("/{provider_id}")
async def update_provider(provider_id: int, data: AIProviderUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data=await ai_provider_service.update(db, current_user.id, provider_id, data))


@router.delete("/{provider_id}")
async def delete_provider(provider_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await ai_provider_service.delete(db, current_user.id, provider_id)
    return ApiResponse.success(data={"deleted": True})


@router.post("/{provider_id}/test")
async def test_provider(provider_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data=await ai_provider_service.test(db, current_user.id, provider_id))


@router.post("/{provider_id}/activate")
async def activate_provider(provider_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data=await ai_provider_service.activate(db, current_user.id, provider_id))


@router.get("/{provider_id}/models")
async def get_models(provider_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse.success(data={"models": await ai_provider_service.models(db, current_user.id, provider_id)})

