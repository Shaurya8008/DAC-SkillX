from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import USE_REAL_EMBEDDINGS, USE_REAL_GITHUB, USE_REAL_LLM
from app.routers.v1 import router as v1_router

app = FastAPI(title="SkillX AI Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": {
            "embeddings": "real" if USE_REAL_EMBEDDINGS else "mock",
            "llm": "real" if USE_REAL_LLM else "mock",
            "github": "real" if USE_REAL_GITHUB else "mock",
        },
    }
