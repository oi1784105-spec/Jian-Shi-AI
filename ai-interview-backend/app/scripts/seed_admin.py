"""
初始化默认管理员账号
运行方式: docker exec -it jianshi-ai-app python -m app.scripts.seed_admin
"""
import asyncio
from sqlalchemy import select
from app.db.session import async_session
from app.models.admin import Admin
from app.core.config import settings


async def seed():
    if not settings.ADMIN_PASSWORD:
        raise RuntimeError("请先在 .env 中设置 ADMIN_PASSWORD")

    async with async_session() as db:
        # 检查管理员是否已存在
        result = await db.execute(select(Admin).where(Admin.email == settings.ADMIN_EMAIL))
        if result.scalar_one_or_none():
            print("管理员已存在，跳过创建。")
            return

        admin = Admin(
            email=settings.ADMIN_EMAIL,
            first_name="Admin",
            last_name="JianShi AI",
            password=Admin.get_password_hash(settings.ADMIN_PASSWORD),
            role="superadmin",
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print(f"默认管理员已创建: {settings.ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed())
