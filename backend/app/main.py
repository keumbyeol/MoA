
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
import app.models  # 모든 SQLAlchemy 모델 등록

from app.routers.auth import router as auth_router
from app.routers.wage import router as wage_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MOA API",
    description="사회 초년생을 위한 AI 생활 금융 가이드",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 인증 API
app.include_router(auth_router)

# 임금 계산기 API
app.include_router(wage_router)


@app.get("/")
def root():
    return {
        "message": "MOA API 서버가 정상적으로 실행 중입니다."
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }
