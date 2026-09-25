"""Repository layer for Project CRUD — abstracts DB queries."""
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project, ProjectStatus


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project: Project) -> Project:
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def get_by_id(self, project_id: int) -> Optional[Project]:
        result = await self.session.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self, limit: int = 50) -> List[Project]:
        result = await self.session.execute(
            select(Project).order_by(Project.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def update_status(
        self,
        project_id: int,
        status: ProjectStatus,
        progress: float = 0.0,
        progress_stage: str = "",
        error_message: Optional[str] = None,
    ) -> None:
        await self.session.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(
                status=status,
                progress=progress,
                progress_stage=progress_stage,
                error_message=error_message,
            )
        )
        await self.session.commit()

    async def update_output(
        self,
        project_id: int,
        output_video_path: str,
        thumbnail_path: Optional[str],
    ) -> None:
        await self.session.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(output_video_path=output_video_path, thumbnail_path=thumbnail_path)
        )
        await self.session.commit()

    async def update_caption(
        self, project_id: int, title: str, hashtags: str
    ) -> None:
        await self.session.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(title=title, hashtags=hashtags)
        )
        await self.session.commit()

    async def delete(self, project_id: int) -> bool:
        project = await self.get_by_id(project_id)
        if not project:
            return False
        await self.session.delete(project)
        await self.session.commit()
        return True
