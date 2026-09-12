import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/engine";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...profile,
    passwordHash: undefined,
    skills: JSON.parse(profile.skills),
    verifiedSkills: JSON.parse(profile.verifiedSkills),
    repoStack: profile.repoStack ? JSON.parse(profile.repoStack) : null,
    embedding: undefined,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { githubHandle, erp, batch, bio, skills } = body as {
    githubHandle?: string;
    erp?: string;
    batch?: string;
    bio?: string;
    skills?: string[];
  };

  let embedding: string | undefined;
  if (bio !== undefined || skills !== undefined) {
    try {
      const result = await embedText(`${bio ?? ""} Skills: ${(skills ?? []).join(", ")}`);
      embedding = JSON.stringify(result.embedding);
    } catch {
      embedding = undefined;
    }
  }

  const profile = await prisma.profile.update({
    where: { id: session.user.id },
    data: {
      githubHandle,
      erp,
      batch,
      bio,
      ...(skills !== undefined ? { skills: JSON.stringify(skills) } : {}),
      ...(embedding !== undefined ? { embedding } : {}),
    },
  });

  return NextResponse.json({
    ...profile,
    passwordHash: undefined,
    skills: JSON.parse(profile.skills),
    verifiedSkills: JSON.parse(profile.verifiedSkills),
    repoStack: profile.repoStack ? JSON.parse(profile.repoStack) : null,
    embedding: undefined,
  });
}
