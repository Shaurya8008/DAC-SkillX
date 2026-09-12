import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateRepo } from "@/lib/engine";

// FR-04 GitHub Repo Vetting: analyzes a public repo and merges its verified
// skills into the student's verifiedSkills list (kept separate from the
// self-reported `skills` tags).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { repoName } = (await req.json()) as { repoName?: string };
  if (!repoName) return NextResponse.json({ error: "repoName is required" }, { status: 400 });

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!profile.githubHandle) {
    return NextResponse.json({ error: "Add a GitHub handle to your profile first" }, { status: 400 });
  }

  const result = await evaluateRepo({ github_handle: profile.githubHandle, repo_name: repoName });

  const existingVerified: string[] = JSON.parse(profile.verifiedSkills);
  const mergedVerified = Array.from(new Set([...existingVerified, ...result.verified_skills]));

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      verifiedSkills: JSON.stringify(mergedVerified),
      repoStack: JSON.stringify(result.primary_stack),
      repoComplexity: result.complexity_score,
    },
  });

  return NextResponse.json({
    complexity_score: result.complexity_score,
    primary_stack: result.primary_stack,
    verified_skills: mergedVerified,
    updatedAt: updated.updatedAt,
  });
}
