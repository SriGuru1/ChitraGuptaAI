from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .routers import auth as auth_router
from .routers import grading as grading_router
from .routers import tests as tests_router

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(auth_router.router)
app.include_router(tests_router.router)
app.include_router(grading_router.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


