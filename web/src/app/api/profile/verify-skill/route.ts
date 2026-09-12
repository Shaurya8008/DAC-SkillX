import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuiz } from "@/lib/engine";

const PASS_THRESHOLD = 0.6;

// Grades a submitted quiz server-side (the mock diagnostic engine is
// deterministic per skill, so re-fetching it here reproduces the same
// questions/answers without ever sending answer_index to the client).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skill, answers } = (await req.json()) as { skill?: string; answers?: number[] };
  if (!skill || !Array.isArray(answers)) {
    return NextResponse.json({ error: "skill and answers[] are required" }, { status: 400 });
  }

  const quiz = await getQuiz(skill);
  const correct = quiz.questions.reduce(
    (count, q, i) => (answers[i] === q.answer_index ? count + 1 : count),
    0
  );
  const score = correct / quiz.questions.length;
  const passed = score >= PASS_THRESHOLD;

  if (passed) {
    const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
    if (profile) {
      const verified: string[] = JSON.parse(profile.verifiedSkills);
      if (!verified.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        verified.push(skill);
        await prisma.profile.update({
          where: { id: profile.id },
          data: { verifiedSkills: JSON.stringify(verified) },
        });
      }
    }
  }

  return NextResponse.json({ correct, total: quiz.questions.length, score, passed });
}
