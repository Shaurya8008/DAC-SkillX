import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/engine";

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });

  return NextResponse.json(
    opportunities.map((o) => ({
      ...o,
      requiredSkills: JSON.parse(o.requiredSkills),
      embedding: undefined,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, opportunityType, requiredSkills } = body as {
    title?: string;
    description?: string;
    opportunityType?: string;
    requiredSkills?: string[];
  };

  if (!title || !description || !opportunityType) {
    return NextResponse.json(
      { error: "title, description, and opportunityType are required" },
      { status: 400 }
    );
  }

  const allowedTypes = ["hackathon", "research", "campus_role", "project"];
  if (!allowedTypes.includes(opportunityType)) {
    return NextResponse.json({ error: `opportunityType must be one of ${allowedTypes.join(", ")}` }, { status: 400 });
  }

  let embedding: string | null = null;
  try {
    const result = await embedText(description);
    embedding = JSON.stringify(result.embedding);
  } catch {
    embedding = null;
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      title,
      description,
      opportunityType,
      requiredSkills: JSON.stringify(requiredSkills ?? []),
      embedding,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ ...opportunity, requiredSkills: JSON.parse(opportunity.requiredSkills), embedding: undefined });
}
