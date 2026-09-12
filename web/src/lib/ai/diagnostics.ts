import { GEMINI_API_KEY, USE_REAL_AI } from "./config";

export type QuizQuestion = { question: string; options: string[]; answer_index: number };

const MOCK_BANK: Record<string, QuizQuestion[]> = {
  python: [
    {
      question: "What does `[x for x in range(5) if x % 2 == 0]` evaluate to?",
      options: ["[0, 2, 4]", "[1, 3, 5]", "[0, 1, 2, 3, 4]", "SyntaxError"],
      answer_index: 0,
    },
    {
      question: "What is the output of `print(type([]))`?",
      options: ["<class 'list'>", "<class 'tuple'>", "<class 'array'>", "<class 'set'>"],
      answer_index: 0,
    },
  ],
  react: [
    {
      question: "Which hook lets you run code after every render by default?",
      options: ["useEffect", "useMemo", "useRef", "useContext"],
      answer_index: 0,
    },
    {
      question: "What triggers a React functional component to re-render?",
      options: ["State or props changing", "Only prop changes", "Only a page refresh", "Nothing, it renders once"],
      answer_index: 0,
    },
  ],
};

const GENERIC_TEMPLATE: QuizQuestion = {
  question: "Given a snippet using {skill}, which change would most likely break backward compatibility?",
  options: [
    "Changing a public function's signature",
    "Adding a private helper function",
    "Renaming a local variable",
    "Adding a comment",
  ],
  answer_index: 0,
};

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashToSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  return hash;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function mockQuiz(skill: string): QuizQuestion[] {
  const key = skill.trim().toLowerCase();
  const bank = MOCK_BANK[key] ?? [];
  const questions = [...bank];
  while (questions.length < 5) {
    questions.push({
      question: GENERIC_TEMPLATE.question.replace("{skill}", skill),
      options: GENERIC_TEMPLATE.options,
      answer_index: GENERIC_TEMPLATE.answer_index,
    });
  }
  return seededShuffle(questions, hashToSeed(key)).slice(0, 5);
}

const QUIZ_PROMPT = (skill: string) =>
  `Generate exactly 5 multiple-choice code comprehension questions to validate ` +
  `intermediate/advanced proficiency in ${skill}. Return strict JSON: a list of ` +
  `objects each with "question", "options" (4 strings), "answer_index" (0-3).`;

async function geminiQuiz(skill: string): Promise<QuizQuestion[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: QUIZ_PROMPT(skill) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini quiz generation failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const content = data.candidates[0].content.parts[0].text as string;
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.questions;
}

export async function generateQuiz(skill: string): Promise<QuizQuestion[]> {
  if (USE_REAL_AI) return geminiQuiz(skill);
  return mockQuiz(skill);
}
