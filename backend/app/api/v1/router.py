from fastapi import APIRouter

from app.api.v1 import exports, jobs, projects, stems

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(projects.router)
api_router.include_router(jobs.router)
api_router.include_router(stems.router)
api_router.include_router(exports.router)
