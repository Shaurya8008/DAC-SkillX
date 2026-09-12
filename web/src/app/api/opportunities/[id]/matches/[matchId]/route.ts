import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: the opportunity's owner (or an admin) accepts/declines one specific
// candidate. Allowed from any current status, in either direction — a lead
// may decide on someone who never explicitly applied, and may reverse a
// mis-click (accepted <-> declined). No rigid state machine, pilot-scale.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = (await req.json()) as { status?: string };
  if (status !== "accepted" && status !== "declined") {
    return NextResponse.json({ error: 'status must be "accepted" or "declined"' }, { status: 400 });
  }

  const { id, matchId } = await params;
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = opportunity.createdById === session.user.id || session.user.role === "admin";
  if (!isOwnerOrAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.opportunityId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.match.update({ where: { id: matchId }, data: { status } });
  return NextResponse.json(updated);
}
