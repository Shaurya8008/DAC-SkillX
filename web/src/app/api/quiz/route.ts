import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuiz } from "@/lib/engine";
import { createQuizToken } from "@/lib/quiz-token";

// FR-05 Adaptive Diagnostic Engine: serves a 5-question quiz for a claimed
// skill. answer_index is stripped before sending to the client; the correct
// answers travel instead as a signed `token` the client echoes back on
// submit (see /api/profile/verify-skill). This works whether the engine is
// the deterministic mock or a real, non-deterministic LLM — the answer key
// is captured once, at generation time, not re-derived later.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");
  if (!skill) return NextResponse.json({ error: "skill query param is required" }, { status: 400 });

  const quiz = await getQuiz(skill);
  const token = createQuizToken(skill, quiz.questions.map((q) => q.answer_index));

  return NextResponse.json({
    skill: quiz.skill,
    token,
    questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
  });
}
