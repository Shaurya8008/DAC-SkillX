"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  { value: "hackathon", label: "Hackathon" },
  { value: "research", label: "Research Lab" },
  { value: "campus_role", label: "Campus Role" },
  { value: "project", label: "Project" },
];

export default function NewOpportunityPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    opportunityType: "hackathon",
    requiredSkills: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requiredSkills = form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requiredSkills }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to post opportunity.");
      setLoading(false);
      return;
    }

    const opportunity = await res.json();
    router.push(`/opportunities/${opportunity.id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Post an opportunity</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opportunityType">Type</Label>
              <Select
                value={form.opportunityType}
                onValueChange={(value) => setForm({ ...form, opportunityType: value as string })}
              >
                <SelectTrigger id="opportunityType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requiredSkills">Required skills (comma-separated)</Label>
              <Input
                id="requiredSkills"
                placeholder="PyTorch, Next.js, Python"
                value={form.requiredSkills}
                onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description / brief</Label>
              <Textarea
                id="description"
                rows={6}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Posting…" : "Post opportunity"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
