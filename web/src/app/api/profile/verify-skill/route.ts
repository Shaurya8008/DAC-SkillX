import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyQuizToken } from "@/lib/quiz-token";

const PASS_THRESHOLD = 0.6;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skill, answers, token } = (await req.json()) as {
    skill?: string;
    answers?: number[];
    token?: string;
  };
  if (!skill || !Array.isArray(answers) || !token) {
    return NextResponse.json({ error: "skill, answers[], and token are required" }, { status: 400 });
  }

  const correctAnswers = verifyQuizToken(token, skill);
  if (!correctAnswers) {
    return NextResponse.json({ error: "Quiz token invalid or expired — reload the quiz" }, { status: 400 });
  }

  const correct = correctAnswers.reduce((count, ans, i) => (answers[i] === ans ? count + 1 : count), 0);
  const score = correct / correctAnswers.length;
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

  return NextResponse.json({ correct, total: correctAnswers.length, score, passed });
}
