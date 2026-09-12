import { cosineSimilarity, embed } from "./embeddings";

const HARD_WEIGHT = 0.6;
const SEMANTIC_WEIGHT = 0.4;

export type MatchResult = {
  match_percentage: number;
  hard_skill_overlap: number;
  semantic_fit: number;
};

export function hardSkillOverlap(studentSkills: string[], requiredSkills: string[]): number {
  const required = new Set(requiredSkills.map((s) => s.trim().toLowerCase()).filter(Boolean));
  if (required.size === 0) return 0;
  const student = new Set(studentSkills.map((s) => s.trim().toLowerCase()).filter(Boolean));
  let overlap = 0;
  for (const skill of required) if (student.has(skill)) overlap++;
  return Math.round((overlap / required.size) * 10000) / 100;
}

export async function semanticFit(studentBio: string, opportunityDescription: string): Promise<number> {
  const [studentVec, opportunityVec] = await Promise.all([embed(studentBio || ""), embed(opportunityDescription || "")]);
  const sim = cosineSimilarity(studentVec, opportunityVec);
  return Math.round(Math.max(0, sim) * 10000) / 100;
}

export async function computeMatch(
  studentSkills: string[],
  studentBio: string,
  opportunityRequirements: string[],
  opportunityDescription: string
): Promise<MatchResult> {
  const hard = hardSkillOverlap(studentSkills, opportunityRequirements);
  const semantic = await semanticFit(studentBio, opportunityDescription);
  const total = Math.round((HARD_WEIGHT * hard + SEMANTIC_WEIGHT * semantic) * 100) / 100;
  return { match_percentage: total, hard_skill_overlap: hard, semantic_fit: semantic };
}
