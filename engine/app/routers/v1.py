from fastapi import APIRouter
from pydantic import BaseModel

from app.config import EMBEDDING_DIM
from app.services.diagnostics import generate_quiz
from app.services.embeddings import embed
from app.services.matching import compute_match
from app.services.repo_eval import evaluate_repo

router = APIRouter(prefix="/api/v1")


class MatchScoreRequest(BaseModel):
    student_skills: list[str]
    student_bio: str
    opportunity_requirements: list[str]
    opportunity_description: str


class MatchScoreResponse(BaseModel):
    match_percentage: float
    hard_skill_overlap: float
    semantic_fit: float


@router.post("/match-score", response_model=MatchScoreResponse)
async def match_score(req: MatchScoreRequest):
    return await compute_match(
        req.student_skills, req.student_bio, req.opportunity_requirements, req.opportunity_description
    )


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


@router.post("/embed", response_model=EmbedResponse)
async def embed_text(req: EmbedRequest):
    vector = await embed(req.text)
    return {"embedding": vector, "dim": EMBEDDING_DIM}


class EvaluateRepoRequest(BaseModel):
    github_handle: str
    repo_name: str


class EvaluateRepoResponse(BaseModel):
    complexity_score: float
    primary_stack: list[str]
    verified_skills: list[str]


@router.post("/evaluaterepo", response_model=EvaluateRepoResponse)
async def evaluate_repo_endpoint(req: EvaluateRepoRequest):
    return await evaluate_repo(req.github_handle, req.repo_name)


class QuizRequest(BaseModel):
    skill: str


@router.post("/quiz")
async def quiz(req: QuizRequest):
    questions = await generate_quiz(req.skill)
    return {"skill": req.skill, "questions": questions}
