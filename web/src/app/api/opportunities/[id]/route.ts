import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { createdBy: { select: { fullName: true } } },
  });
  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...opportunity,
    requiredSkills: JSON.parse(opportunity.requiredSkills),
    embedding: undefined,
  });
}
