
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.wage import router as wage_router
from app.routers.guide import router as guide_router
from app.routers.policy import router as policy_router
from app.routers.law import router as law_router
from app.routers.chat import router as chat_router
from app.routers.quiz import router as quiz_router


app = FastAPI(
    title="MOA API",
    description="MOA 금융정보 및 근로정보 안내 서비스 API",
    version="1.0.0",
)

# CORS 설정
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

# API 라우터 등록
app.include_router(auth_router)
app.include_router(wage_router)
app.include_router(guide_router)
app.include_router(policy_router)
app.include_router(law_router)
app.include_router(chat_router)
app.include_router(quiz_router)


@app.get("/")
def root():
    return {
        "message": "MOA API 서버가 실행 중입니다."
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }
