"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkillQuiz } from "@/components/skill-quiz";

type Profile = {
  id: string;
  fullName: string;
  email: string;
  githubHandle: string | null;
  erp: string | null;
  batch: string | null;
  bio: string | null;
  skills: string[];
  verifiedSkills: string[];
  repoStack: string[] | null;
  repoComplexity: number | null;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
  });

  const [form, setForm] = useState<{ githubHandle: string; erp: string; batch: string; bio: string; skills: string }>({
    githubHandle: "",
    erp: "",
    batch: "",
    bio: "",
    skills: "",
  });
  const [saved, setSaved] = useState(false);
  const [quizSkill, setQuizSkill] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [repoError, setRepoError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        githubHandle: profile.githubHandle ?? "",
        erp: profile.erp ?? "",
        batch: profile.batch ?? "",
        bio: profile.bio ?? "",
        skills: profile.skills.join(", "),
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, skills }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const verifyRepo = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/verify-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to analyze repo");
      }
      return res.json();
    },
    onSuccess: () => {
      setRepoError(null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => setRepoError(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading profile…</p>;
  if (!profile) return <p className="text-muted-foreground">Sign in to view your profile.</p>;

  const unverifiedSkills = profile.skills.filter(
    (s) => !profile.verifiedSkills.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{profile.fullName}</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verified skills</CardTitle>
          <CardDescription>Backed by repo evidence or a passed diagnostic quiz.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profile.verifiedSkills.length === 0 && (
            <p className="text-sm text-muted-foreground">None yet — verify a skill below or analyze a repo.</p>
          )}
          {profile.verifiedSkills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Self-reported skill tags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profile.skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
          {profile.skills.map((s) => {
            const isVerified = !unverifiedSkills.includes(s);
            return (
              <div key={s} className="flex items-center gap-1">
                <Badge variant={isVerified ? "default" : "secondary"}>{s}</Badge>
                {isVerified ? null : (
                  <button
                    type="button"
                    onClick={() => setQuizSkill(s)}
                    className="text-xs text-primary underline underline-offset-2"
                  >
                    verify
                  </button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {quizSkill && (
        <SkillQuiz
          skill={quizSkill}
          onClose={() => setQuizSkill(null)}
          onVerified={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GitHub repo vetting</CardTitle>
          <CardDescription>
            Analyze a public repo under {profile.githubHandle ? `github.com/${profile.githubHandle}` : "your GitHub handle"} —
            commit cadence, language distribution, and documentation quality feed your verified skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="repo-name" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
            <Button onClick={() => verifyRepo.mutate()} disabled={verifyRepo.isPending || !repoName}>
              {verifyRepo.isPending ? "Analyzing…" : "Analyze repo"}
            </Button>
          </div>
          {repoError && <p className="text-sm text-destructive">{repoError}</p>}
          {profile.repoComplexity !== null && (
            <div className="rounded-md border p-3 text-sm">
              <p>
                Complexity score: <span className="font-medium">{profile.repoComplexity.toFixed(1)}/10</span>
              </p>
              <p className="text-muted-foreground">Stack: {profile.repoStack?.join(", ")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="githubHandle">GitHub handle</Label>
              <Input
                id="githubHandle"
                value={form.githubHandle}
                onChange={(e) => setForm({ ...form, githubHandle: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="erp">ERP no.</Label>
              <Input id="erp" value={form.erp} onChange={(e) => setForm({ ...form, erp: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch">Batch</Label>
              <Input id="batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skills">Core skills (comma-separated)</Label>
            <Input id="skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Experience bio</Label>
            <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-muted-foreground">Saved — embedding refreshed.</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
