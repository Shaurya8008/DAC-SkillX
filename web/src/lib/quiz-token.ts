import crypto from "crypto";

// The engine may be backed by a real LLM (non-deterministic), so we can't
// re-derive the correct answers by re-asking it. Instead, the answer key is
// captured once at quiz-generation time and carried back to us as a signed,
// tamper-evident token — the client holds it but can't read or forge it
// without this secret.

const SECRET = process.env.AUTH_SECRET ?? "dev-only-change-me-skillx-secret";
const TOKEN_TTL_MS = 15 * 60 * 1000;

type Payload = { skill: string; answers: number[]; exp: number };

function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createQuizToken(skill: string, answers: number[]): string {
  const payload: Payload = { skill, answers, exp: Date.now() + TOKEN_TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyQuizToken(token: string, skill: string): number[] | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  if (sign(data) !== signature) return null;

  const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
  if (payload.exp < Date.now()) return null;
  if (payload.skill.toLowerCase() !== skill.toLowerCase()) return null;
  return payload.answers;
}
