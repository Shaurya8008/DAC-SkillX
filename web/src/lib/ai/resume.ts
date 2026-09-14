import { GEMINI_API_KEY, USE_REAL_AI } from "./config";

// alias -> canonical tag. Canonical tags use the same lowercase style as
// repo-eval's verified skills so resume-sourced tags line up with repo/quiz ones.
const SKILL_ALIASES: Record<string, string> = {
  python: "python",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  C: "c",
  "c++": "c++",
  cpp: "c++",
  "c#": "c#",
  csharp: "c#",
  ".net": "dotnet",
  dotnet: "dotnet",
  Go: "go",
  golang: "go",
  rust: "rust",
  kotlin: "kotlin",
  Swift: "swift",
  dart: "dart",
  php: "php",
  ruby: "ruby",
  R: "r",
  scala: "scala",
  matlab: "matlab",
  sql: "sql",
  html: "html",
  css: "css",
  sass: "sass",
  scss: "sass",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  bootstrap: "bootstrap",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  vue: "vue",
  vuejs: "vue",
  "vue.js": "vue",
  angular: "angular",
  svelte: "svelte",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  Express: "express",
  expressjs: "express",
  "express.js": "express",
  django: "django",
  flask: "flask",
  fastapi: "fastapi",
  "spring boot": "spring-boot",
  springboot: "spring-boot",
  laravel: "laravel",
  graphql: "graphql",
  "rest api": "rest-apis",
  "rest apis": "rest-apis",
  "restful api": "rest-apis",
  "restful apis": "rest-apis",
  restful: "rest-apis",
  postgresql: "postgresql",
  postgres: "postgresql",
  mysql: "mysql",
  sqlite: "sqlite",
  mongodb: "mongodb",
  mongo: "mongodb",
  redis: "redis",
  firebase: "firebase",
  supabase: "supabase",
  prisma: "prisma",
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  aws: "aws",
  "amazon web services": "aws",
  gcp: "gcp",
  "google cloud": "gcp",
  azure: "azure",
  vercel: "vercel",
  linux: "linux",
  bash: "bash",
  shell: "bash",
  powershell: "powershell",
  git: "git",
  github: "github",
  "ci/cd": "ci-cd",
  jenkins: "jenkins",
  terraform: "terraform",
  "machine learning": "machine-learning",
  ml: "machine-learning",
  "deep learning": "deep-learning",
  nlp: "nlp",
  "natural language processing": "nlp",
  "computer vision": "computer-vision",
  opencv: "opencv",
  pytorch: "pytorch",
  torch: "pytorch",
  tensorflow: "tensorflow",
  keras: "keras",
  "scikit-learn": "scikit-learn",
  sklearn: "scikit-learn",
  pandas: "pandas",
  numpy: "numpy",
  matplotlib: "matplotlib",
  "data analysis": "data-analysis",
  "data analytics": "data-analysis",
  "data science": "data-science",
  "power bi": "power-bi",
  tableau: "tableau",
  Excel: "excel",
  hadoop: "hadoop",
  spark: "spark",
  pyspark: "spark",
  kafka: "kafka",
  llm: "llms",
  llms: "llms",
  "large language models": "llms",
  langchain: "langchain",
  "hugging face": "huggingface",
  huggingface: "huggingface",
  gemini: "gemini",
  openai: "openai",
  rag: "rag",
  "prompt engineering": "prompt-engineering",
  figma: "figma",
  "ui/ux": "ui-ux",
  "ux design": "ui-ux",
  "react native": "react-native",
  flutter: "flutter",
  android: "android",
  ios: "ios",
  unity: "unity",
  blockchain: "blockchain",
  solidity: "solidity",
  cybersecurity: "cybersecurity",
  "cyber security": "cybersecurity",
  jest: "jest",
  pytest: "pytest",
  selenium: "selenium",
  arduino: "arduino",
  "raspberry pi": "raspberry-pi",
  iot: "iot",
  "embedded systems": "embedded-systems",
  verilog: "verilog",
};

type Matcher = { canonical: string; re: RegExp };

// Word boundaries (\b) break on aliases like "c++", "c#", ".net" and
// "node.js", so the boundary is expressed as "not next to another
// identifier-ish character" instead. Aliases written with a capital in the
// table are matched case-sensitively: they double as ordinary English words
// ("go through", "excel at", "express interest") that resumes are full of.
const MATCHERS: Matcher[] = Object.entries(SKILL_ALIASES).map(([alias, canonical]) => {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&").replace(/\s+/g, "\\s+");
  const flags = /^[A-Z]/.test(alias) ? "" : "i";
  return { canonical, re: new RegExp(`(?<![A-Za-z0-9+#.])${escaped}(?![A-Za-z0-9+#])`, flags) };
});

const MAX_SKILLS = 30;

export function keywordExtract(text: string): string[] {
  const hits = new Map<string, number>();
  for (const { canonical, re } of MATCHERS) {
    const m = re.exec(text);
    if (!m) continue;
    const prev = hits.get(canonical);
    if (prev === undefined || m.index < prev) hits.set(canonical, m.index);
  }
  return [...hits.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([skill]) => skill)
    .slice(0, MAX_SKILLS);
}

const TAG_SHAPE = /^[a-z0-9][a-z0-9+#.\-]{0,29}$/;

// Gemini is free-form ("next.js" one run, "nextjs" the next), so its tags
// are folded onto the same canonical names the keyword scan produces.
const CANONICAL = new Map<string, string>();
for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
  const key = alias.toLowerCase();
  CANONICAL.set(key, canonical);
  CANONICAL.set(key.replace(/\s+/g, "-"), canonical);
}

function normalize(raw: unknown[]): string[] {
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const kebab = item.trim().toLowerCase().replace(/\s+/g, "-");
    const tag = CANONICAL.get(kebab) ?? CANONICAL.get(kebab.replace(/-/g, " ")) ?? kebab;
    if (!TAG_SHAPE.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length >= MAX_SKILLS) break;
  }
  return out;
}

const RESUME_PROMPT = (text: string) =>
  `Below is the plain text of a student's resume. Extract the technical skills ` +
  `it demonstrates: programming languages, frameworks, libraries, databases, ` +
  `cloud/devops tools, and ML/AI techniques. Skip soft skills, job titles and ` +
  `company names. Use short lowercase kebab-case tags (e.g. "python", "react", ` +
  `"machine-learning", "rest-apis", "postgresql"). Return strict JSON of the ` +
  `form {"skills": ["tag", ...]} with at most ${MAX_SKILLS} tags, most prominent first.\n\n` +
  `RESUME:\n${text.slice(0, 15000)}`;

async function geminiExtract(text: string): Promise<string[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: RESUME_PROMPT(text) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini resume extraction failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = data.candidates[0].content.parts[0].text as string;
  const parsed = JSON.parse(content);
  return normalize(Array.isArray(parsed) ? parsed : parsed.skills ?? []);
}

export async function extractSkillsFromResume(text: string): Promise<string[]> {
  if (!USE_REAL_AI) return keywordExtract(text);
  try {
    return await geminiExtract(text);
  } catch (err) {
    // A Gemini hiccup (rate limit, malformed JSON) shouldn't block a profile
    // step the student can't retry cheaply — the keyword scan is a fine floor.
    console.error(err);
    return keywordExtract(text);
  }
}
