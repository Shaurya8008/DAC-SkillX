import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill")?.toLowerCase();
  const batch = searchParams.get("batch");

  const students = await prisma.profile.findMany({
    where: { role: "student", ...(batch ? { batch } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const filtered = students
    .map((s) => ({ ...s, passwordHash: undefined, embedding: undefined, skills: JSON.parse(s.skills) as string[] }))
    .filter((s) => (skill ? s.skills.some((sk) => sk.toLowerCase().includes(skill)) : true));

  return NextResponse.json(filtered);
}
