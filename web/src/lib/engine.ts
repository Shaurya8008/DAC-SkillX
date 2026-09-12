// Thin client for the FastAPI AI engine (PRD sec. 7 API Contract).
// The engine runs in "mock mode" by default — deterministic fake embeddings
// and heuristic repo scoring — so this works with zero API keys. Once
// OPENAI_API_KEY / GROQ_API_KEY are set on the engine, real calls replace
// the mocks with no change needed on this side.

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";

export type MatchScoreResponse = {
  match_percentage: number;
  hard_skill_overlap: number;
  semantic_fit: number;
};

export type EmbedResponse = {
  embedding: number[];
  dim: number;
};

export type EvaluateRepoResponse = {
  complexity_score: number;
  primary_stack: string[];
  verified_skills: string[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer_index: number;
};

export type QuizResponse = {
  skill: string;
  questions: QuizQuestion[];
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${ENGINE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Engine request to ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function getMatchScore(input: {
  student_skills: string[];
  student_bio: string;
  opportunity_requirements: string[];
  opportunity_description: string;
}) {
  return post<MatchScoreResponse>("/api/v1/match-score", input);
}

export function embedText(text: string) {
  return post<EmbedResponse>("/api/v1/embed", { text });
}

export function evaluateRepo(input: { github_handle: string; repo_name: string }) {
  return post<EvaluateRepoResponse>("/api/v1/evaluaterepo", input);
}

export function getQuiz(skill: string) {
  return post<QuizResponse>("/api/v1/quiz", { skill });
}
