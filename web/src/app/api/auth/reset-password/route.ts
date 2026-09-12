import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token, password } = (await req.json()) as { token?: string; password?: string };
  if (!token || !password) {
    return NextResponse.json({ error: "token and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const profile = await prisma.profile.findUnique({ where: { resetTokenHash } });

  if (!profile || !profile.resetTokenExpiresAt || profile.resetTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.profile.update({
    where: { id: profile.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });

  return NextResponse.json({ message: "Password updated" });
}
