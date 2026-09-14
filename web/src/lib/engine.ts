// Local facade over the AI logic (src/lib/ai/) — runs in-process rather than
// calling out to a separate service, so the whole app deploys as a single
// Next.js app (see engine/ for the standalone FastAPI implementation this
// mirrors, kept as the PRD's reference architecture).
//
// Runs in "mock mode" by default — deterministic fake embeddings and
// heuristic repo scoring — so this works with zero API keys. Once
// GEMINI_API_KEY / GITHUB_TOKEN are set, real calls replace the mocks with
// no change needed by callers.

import { computeMatch } from "@/lib/ai/matching";
import { embed } from "@/lib/ai/embeddings";
import { evaluateRepo as evaluateRepoImpl } from "@/lib/ai/repo-eval";
import { generateQuiz } from "@/lib/ai/diagnostics";
import { extractSkillsFromResume } from "@/lib/ai/resume";

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

export async function getMatchScore(input: {
  student_skills: string[];
  student_bio: string;
  opportunity_requirements: string[];
  opportunity_description: string;
}): Promise<MatchScoreResponse> {
  return computeMatch(input.student_skills, input.student_bio, input.opportunity_requirements, input.opportunity_description);
}

export async function embedText(text: string): Promise<EmbedResponse> {
  const embedding = await embed(text);
  return { embedding, dim: embedding.length };
}

export async function evaluateRepo(input: { github_handle: string; repo_name: string }): Promise<EvaluateRepoResponse> {
  return evaluateRepoImpl(input.github_handle, input.repo_name);
}

export async function getQuiz(skill: string): Promise<QuizResponse> {
  const questions = await generateQuiz(skill);
  return { skill, questions };
}

export async function extractResumeSkills(resumeText: string): Promise<string[]> {
  return extractSkillsFromResume(resumeText);
}
