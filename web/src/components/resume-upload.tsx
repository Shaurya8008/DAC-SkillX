"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ExtractResponse = { skills: string[]; chars: number };

// "Machine Learning" on the profile and "machine-learning" from the
// extractor are the same tag for de-duplication purposes.
export const skillKey = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, "-");

export function ResumeUpload({
  existingSkills,
  onAdd,
}: {
  existingSkills: string[];
  onAdd: (skills: string[]) => Promise<unknown>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const existing = new Set(existingSkills.map(skillKey));

  const extract = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile/resume", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to read resume");
      return data as ExtractResponse;
    },
    onMutate: (file) => {
      setError(null);
      setAddedCount(null);
      setExtracted(null);
      setFileName(file.name);
    },
    onSuccess: (data) => {
      setExtracted(data.skills);
      setSelected(new Set(data.skills.filter((s) => !existing.has(skillKey(s)))));
    },
    onError: (e: Error) => setError(e.message),
  });

  const add = useMutation({
    mutationFn: () => onAdd([...selected]),
    onSuccess: () => {
      setAddedCount(selected.size);
      setExtracted(null);
      setSelected(new Set());
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleFile(file: File | undefined) {
    if (file) extract.mutate(file);
  }

  function toggle(skill: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  const newSkills = extracted?.filter((s) => !existing.has(skillKey(s))) ?? [];
  const knownSkills = extracted?.filter((s) => existing.has(skillKey(s))) ?? [];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Import skills from your resume
        </CardTitle>
        <CardDescription>
          Upload a PDF or text resume — we pull out the technical skills, you pick the ones to keep, then verify each
          one with a quiz or repo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          disabled={extract.isPending}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-8 text-center text-sm transition-all hover:border-primary/60 hover:bg-primary/[0.08]",
            dragOver && "scale-[1.01] border-primary bg-primary/10",
            extract.isPending && "opacity-70"
          )}
        >
          {extract.isPending ? (
            <>
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Reading {fileName}…</span>
            </>
          ) : (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-5" />
              </span>
              <span className="font-medium">Drop your resume here or click to browse</span>
              <span className="text-xs text-muted-foreground">PDF or .txt, up to 5 MB</span>
            </>
          )}
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {addedCount !== null && (
          <p className="flex items-center gap-1.5 text-sm text-primary">
            <Check className="size-4" />
            Added {addedCount} skill{addedCount === 1 ? "" : "s"} — tap &ldquo;verify&rdquo; on each one above to back it
            up.
          </p>
        )}

        {extracted && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">
                · {extracted.length} skill{extracted.length === 1 ? "" : "s"} found
              </span>
            </div>

            {extracted.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recognizable technical skills found — add them by hand in the form below.
              </p>
            )}

            {newSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Tap a skill to exclude it.</p>
                <div className="flex flex-wrap gap-2">
                  {newSkills.map((s) => {
                    const on = selected.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggle(s)}
                        aria-pressed={on}
                        className={cn(
                          "inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-all",
                          on
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-transparent text-muted-foreground line-through opacity-60"
                        )}
                      >
                        {on && <Check className="size-3" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {knownSkills.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Already on your profile: {knownSkills.join(", ")}
              </p>
            )}

            {newSkills.length > 0 && (
              <div className="flex items-center gap-2">
                <Button onClick={() => add.mutate()} disabled={add.isPending || selected.size === 0}>
                  {add.isPending ? "Adding…" : `Add ${selected.size} skill${selected.size === 1 ? "" : "s"} to profile`}
                </Button>
                <Button variant="ghost" onClick={() => setExtracted(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
