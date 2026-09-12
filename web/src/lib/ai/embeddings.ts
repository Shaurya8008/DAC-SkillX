import { GEMINI_API_KEY, USE_REAL_AI } from "./config";

const MOCK_DIM = 768;

// Deterministic seeded PRNG (mulberry32) + Box-Muller so the same text
// always produces the same mock vector, without needing a real API key.
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
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  }
  return hash;
}

function mockEmbedding(text: string): number[] {
  const rand = mulberry32(hashToSeed(text));
  const vec: number[] = [];
  for (let i = 0; i < MOCK_DIM; i += 2) {
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    const mag = Math.sqrt(-2 * Math.log(u1));
    vec.push(mag * Math.cos(2 * Math.PI * u2));
    vec.push(mag * Math.sin(2 * Math.PI * u2));
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / norm);
}

async function geminiEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) throw new Error(`Gemini embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values as number[];
}

export async function embed(text: string): Promise<number[]> {
  // Gemini's embedContent rejects empty input outright ("empty Part");
  // an empty bio/description has no semantic content to embed anyway, so
  // skip the real call and go straight to a stable placeholder vector.
  if (!text || !text.trim()) return mockEmbedding("");
  if (USE_REAL_AI) return geminiEmbedding(text);
  return mockEmbedding(text);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
