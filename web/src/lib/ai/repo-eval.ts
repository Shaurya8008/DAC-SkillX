import { GITHUB_TOKEN, USE_REAL_GITHUB } from "./config";

export type RepoEvalResult = { complexity_score: number; primary_stack: string[]; verified_skills: string[] };

const MOCK_STACKS = [
  ["Python", "FastAPI"],
  ["TypeScript", "Next.js", "React"],
  ["Python", "PyTorch"],
  ["Go", "PostgreSQL"],
  ["JavaScript", "Node.js", "Express"],
];

const MOCK_SKILLS_BY_STACK: Record<string, string[]> = {
  Python: ["python", "backend"],
  FastAPI: ["fastapi", "rest-apis"],
  TypeScript: ["typescript", "frontend"],
  "Next.js": ["nextjs", "react"],
  React: ["react"],
  PyTorch: ["pytorch", "machine-learning"],
  Go: ["go", "backend"],
  PostgreSQL: ["postgresql", "sql"],
  JavaScript: ["javascript"],
  "Node.js": ["nodejs", "backend"],
  Express: ["express"],
};

function hashToSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

function mockEvaluate(githubHandle: string, repoName: string): RepoEvalResult {
  const seed = hashToSeed(`${githubHandle}/${repoName}`);
  const stack = MOCK_STACKS[seed % MOCK_STACKS.length];
  const complexity = Math.round((4.0 + ((seed % 6000) / 1000)) * 10) / 10;
  const verifiedSkills = Array.from(new Set(stack.flatMap((lang) => MOCK_SKILLS_BY_STACK[lang] ?? []))).sort();
  return { complexity_score: complexity, primary_stack: stack, verified_skills: verifiedSkills };
}

async function realEvaluate(githubHandle: string, repoName: string): Promise<RepoEvalResult> {
  const headers = { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" };
  const [repoRes, langsRes, commitsRes, readmeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${githubHandle}/${repoName}`, { headers }),
    fetch(`https://api.github.com/repos/${githubHandle}/${repoName}/languages`, { headers }),
    fetch(`https://api.github.com/repos/${githubHandle}/${repoName}/commits?per_page=30`, { headers }),
    fetch(`https://api.github.com/repos/${githubHandle}/${repoName}/readme`, { headers }),
  ]);
  if (!repoRes.ok) throw new Error(`GitHub repo lookup failed: ${repoRes.status}`);

  const languages = langsRes.ok ? Object.keys(await langsRes.json()) : [];
  const commitCount = commitsRes.ok ? (await commitsRes.json()).length : 0;
  const hasReadme = readmeRes.ok;

  const complexity = Math.round(Math.min(10, 3 + commitCount / 10 + (hasReadme ? 2 : 0) + languages.length / 2) * 10) / 10;
  const verifiedSkills = Array.from(new Set(languages.map((l) => l.toLowerCase()))).sort();
  return { complexity_score: complexity, primary_stack: languages.slice(0, 3), verified_skills: verifiedSkills };
}

export async function evaluateRepo(githubHandle: string, repoName: string): Promise<RepoEvalResult> {
  if (USE_REAL_GITHUB) return realEvaluate(githubHandle, repoName);
  return mockEvaluate(githubHandle, repoName);
}
