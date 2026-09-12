const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "DAC SkillX <onboarding@resend.dev>";

// Same mock/real pattern as the AI services (web/src/lib/ai/): with zero
// setup, "sending" an email just logs it server-side so a developer (or a
// student testing locally) can grab the link straight from the terminal.
// Set RESEND_API_KEY to actually deliver mail via Resend.
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.log(`[email:mock] To: ${to}\nSubject: ${subject}\n${html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) {
    throw new Error(`Failed to send email: ${res.status} ${await res.text()}`);
  }
}
