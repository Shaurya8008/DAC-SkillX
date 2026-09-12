import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Always responds with the same generic message regardless of whether the
// email exists, is a Google-only account, or a reset was actually sent —
// otherwise this endpoint would let anyone enumerate registered emails.
const GENERIC_MESSAGE = "If an account exists for that email, a reset link has been sent.";

export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const profile = await prisma.profile.findUnique({ where: { email } });

  // Google-only accounts have no passwordHash to reset — silently skip
  // token creation but still return the generic message.
  if (profile?.passwordHash) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.profile.update({
      where: { id: profile.id },
      data: { resetTokenHash, resetTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    });

    const resetUrl = `${new URL(req.url).origin}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: profile.email,
      subject: "Reset your DAC SkillX password",
      html: `<p>Someone requested a password reset for your SkillX account.</p><p><a href="${resetUrl}">Reset your password</a> — this link expires in 1 hour.</p><p>If you didn't request this, you can ignore this email.</p>`,
    });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
