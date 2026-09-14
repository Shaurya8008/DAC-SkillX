import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { auth } from "@/lib/auth";
import { extractResumeSkills } from "@/lib/engine";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isText(file: File) {
  return file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
}

// Extracts skill tags from an uploaded resume. Nothing is persisted here: the
// client shows the tags for review and the ones the student keeps go through
// the normal PATCH /api/profile path, so they land as ordinary self-reported
// tags that the quiz / repo flows can then verify.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "A file is required" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max file size is 5 MB" }, { status: 413 });

  let text: string;
  if (isPdf(file)) {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      const result = await extractText(pdf, { mergePages: true });
      text = result.text;
    } catch {
      return NextResponse.json({ error: "Couldn't read that PDF — is it password protected?" }, { status: 422 });
    }
  } else if (isText(file)) {
    text = await file.text();
  } else {
    return NextResponse.json({ error: "Upload a PDF or plain-text resume" }, { status: 415 });
  }

  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 40) {
    return NextResponse.json(
      { error: "No readable text found — scanned image PDFs aren't supported yet, try a text-based export" },
      { status: 422 }
    );
  }

  const skills = await extractResumeSkills(cleaned);
  return NextResponse.json({ skills, chars: cleaned.length });
}
