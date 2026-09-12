import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuiz } from "@/lib/engine";

// FR-05 Adaptive Diagnostic Engine: serves a 5-question quiz for a claimed
// skill. answer_index is stripped before sending to the client — grading
// happens server-side in /api/profile/verify-skill.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill");
  if (!skill) return NextResponse.json({ error: "skill query param is required" }, { status: 400 });

  const quiz = await getQuiz(skill);
  return NextResponse.json({
    skill: quiz.skill,
    questions: quiz.questions.map((q) => ({ question: q.question, options: q.options })),
  });
}
