import asyncio
import json
import logging
import os
import uuid
from typing import Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.resume import Resume
from app.services.client.ai_service import AIService
from app.services.client.ai_provider_service import ai_provider_service
from app.exceptions.http_exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

# 简历上传目录
UPLOAD_DIR = "uploads/resumes"
MAX_RESUME_TEXT_CHARS = 30_000
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ResumeService:

    @staticmethod
    async def create_pending(
        db: AsyncSession,
        user_id: int,
        file_content: bytes,
        file_name: str,
        target_position: str,
    ) -> Dict:
        """Persist an uploaded resume and return before any AI request starts."""
        provider = await ai_provider_service.active(db, user_id)
        safe_name = os.path.basename(file_name) or "resume.pdf"
        file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{uuid.uuid4().hex}_{safe_name}")
        await asyncio.to_thread(_write_file, file_path, file_content)

        resume = Resume(
            user_id=user_id,
            file_url=file_path,
            file_name=safe_name,
            target_position=target_position,
            status="parsing",
        )
        db.add(resume)
        await db.commit()
        await db.refresh(resume)
        return {"resume_id": resume.id, "status": resume.status, "provider_id": provider.id}

    @staticmethod
    async def process_pending(
        db: AsyncSession,
        user_id: int,
        resume_id: int,
        provider_id: int,
    ) -> Dict:
        """Extract text and run AI analysis for a previously persisted resume."""
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        resume = result.scalar_one_or_none()
        if not resume:
            raise NotFoundError(message="简历不存在")

        try:
            provider = await ai_provider_service._owned(db, user_id, provider_id)
            if not provider.is_validated:
                raise ValidationError(message="该面试使用的 API 配置已不可用")
            ai = AIService(ai_provider_service.runtime(provider))

            # pdfplumber is synchronous and CPU-heavy; keep it off the event loop.
            resume_text = await asyncio.to_thread(ResumeService._extract_pdf_text, resume.file_url)
            if not resume_text.strip():
                raise ValidationError(message="无法从 PDF 中提取文本内容")

            # A normal resume is far below this limit. Capping unusually large
            # documents keeps provider latency and token usage predictable.
            resume_text = resume_text[:MAX_RESUME_TEXT_CHARS]
            parsed, analysis = await ai.parse_and_analyze_resume(
                resume_text,
                resume.target_position or "",
            )
            resume.parsed_content = json.dumps(parsed, ensure_ascii=False)
            resume.analysis = json.dumps(analysis, ensure_ascii=False)
            resume.status = "completed"
            await db.commit()
            return {"resume_id": resume.id, "status": resume.status}
        except Exception:
            resume.status = "failed"
            await db.commit()
            logger.exception("Resume processing failed resume_id=%s", resume_id)
            raise

    @staticmethod
    async def upload_and_parse(
        db: AsyncSession,
        user_id: int,
        file_content: bytes,
        file_name: str,
        target_position: str
    ) -> Dict:
        """Compatibility helper for callers that still need synchronous processing."""
        pending = await ResumeService.create_pending(
            db, user_id, file_content, file_name, target_position
        )
        await ResumeService.process_pending(
            db, user_id, pending["resume_id"], pending["provider_id"]
        )
        return {
            "resume_id": pending["resume_id"],
            "status": "completed",
            "message": "简历上传并解析成功",
        }

    @staticmethod
    def _extract_pdf_text(file_path: str) -> str:
        """从 PDF 文件中提取文本内容"""
        import pdfplumber
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text

    @staticmethod
    async def get_resume(db: AsyncSession, resume_id: int, user_id: int) -> Dict:
        """根据 ID 获取简历详情"""
        query = select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == user_id
        )
        result = await db.execute(query)
        resume = result.scalar_one_or_none()

        if not resume:
            raise NotFoundError(message="简历不存在")

        parsed_content = None
        if resume.parsed_content:
            try:
                parsed_content = json.loads(resume.parsed_content)
            except json.JSONDecodeError:
                parsed_content = None

        analysis = None
        if resume.analysis:
            try:
                analysis = json.loads(resume.analysis)
            except json.JSONDecodeError:
                analysis = None

        return {
            "resume_id": resume.id,
            "status": resume.status,
            "file_name": resume.file_name,
            "target_position": resume.target_position,
            "parsed_content": parsed_content,
            "analysis": analysis,
            "created_at": resume.created_at.isoformat() if resume.created_at else None
        }

    @staticmethod
    async def get_user_resumes(db: AsyncSession, user_id: int) -> list:
        """获取用户的所有简历列表"""
        query = select(Resume).where(
            Resume.user_id == user_id
        ).order_by(Resume.created_at.desc())
        result = await db.execute(query)
        resumes = result.scalars().all()

        return [
            {
                "resume_id": r.id,
                "file_name": r.file_name,
                "target_position": r.target_position,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in resumes
        ]


resume_service = ResumeService()


def _write_file(file_path: str, content: bytes) -> None:
    with open(file_path, "wb") as output:
        output.write(content)
