import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMatchScore } from "@/lib/engine";

// POST: the logged-in student computes (or refreshes) their own match score
// against this opportunity — FR-02 Hybrid Matching Engine.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [student, opportunity] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.user.id } }),
    prisma.opportunity.findUnique({ where: { id } }),
  ]);
  if (!student || !opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const score = await getMatchScore({
    student_skills: JSON.parse(student.skills),
    student_bio: student.bio ?? "",
    opportunity_requirements: JSON.parse(opportunity.requiredSkills),
    opportunity_description: opportunity.description,
  });

  const match = await prisma.match.upsert({
    where: { studentId_opportunityId: { studentId: student.id, opportunityId: opportunity.id } },
    create: {
      studentId: student.id,
      opportunityId: opportunity.id,
      hardSkillScore: score.hard_skill_overlap,
      semanticScore: score.semantic_fit,
      finalScore: score.match_percentage,
    },
    // status is intentionally omitted here — recomputing a score must never
    // regress an already-applied/accepted/declined match back to "suggested".
    update: {
      hardSkillScore: score.hard_skill_overlap,
      semanticScore: score.semantic_fit,
      finalScore: score.match_percentage,
    },
  });

  return NextResponse.json(match);
}

// PATCH: the logged-in student applies to their own match (suggested -> applied).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = (await req.json()) as { status?: string };
  if (status !== "applied") {
    return NextResponse.json({ error: 'status must be "applied"' }, { status: 400 });
  }

  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { studentId_opportunityId: { studentId: session.user.id, opportunityId: id } },
  });
  if (!match) {
    return NextResponse.json({ error: "Compute your match before applying" }, { status: 404 });
  }
  if (match.status !== "suggested") {
    return NextResponse.json({ error: `Match is already ${match.status}` }, { status: 409 });
  }

  const updated = await prisma.match.update({ where: { id: match.id }, data: { status: "applied" } });
  return NextResponse.json(updated);
}

// GET: the opportunity's creator (or an admin) sees the ranked candidate list;
// anyone else sees only their own match, if it exists.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = opportunity.createdById === session.user.id || session.user.role === "admin";

  if (isOwnerOrAdmin) {
    const matches = await prisma.match.findMany({
      where: { opportunityId: id },
      orderBy: { finalScore: "desc" },
      include: { student: { select: { id: true, fullName: true, githubHandle: true, email: true } } },
    });
    return NextResponse.json(matches);
  }

  const own = await prisma.match.findUnique({
    where: { studentId_opportunityId: { studentId: session.user.id, opportunityId: id } },
  });
  return NextResponse.json(own ? [own] : []);
}
