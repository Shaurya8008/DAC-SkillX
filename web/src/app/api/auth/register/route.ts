import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/engine";

export async function POST(req: Request) {
  const body = await req.json();
  const { fullName, email, password, githubHandle, erp, batch, bio, skills } = body as {
    fullName?: string;
    email?: string;
    password?: string;
    githubHandle?: string;
    erp?: string;
    batch?: string;
    bio?: string;
    skills?: string[];
  };

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "fullName, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const skillList = skills ?? [];

  let embedding: number[] | null = null;
  try {
    const result = await embedText(`${bio ?? ""} Skills: ${skillList.join(", ")}`);
    embedding = result.embedding;
  } catch {
    // Engine unreachable — profile still gets created, embedding backfills later.
    embedding = null;
  }

  const profile = await prisma.profile.create({
    data: {
      authUserId: email,
      fullName,
      email,
      passwordHash,
      githubHandle,
      erp,
      batch,
      bio,
      skills: JSON.stringify(skillList),
      embedding: embedding ? JSON.stringify(embedding) : null,
    },
  });

  return NextResponse.json({ id: profile.id, email: profile.email });
}
