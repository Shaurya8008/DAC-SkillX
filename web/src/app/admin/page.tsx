"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Student = {
  id: string;
  fullName: string;
  email: string;
  githubHandle: string | null;
  batch: string | null;
  skills: string[];
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [skill, setSkill] = useState("");
  const [batch, setBatch] = useState("");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["admin-students", skill, batch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (skill) params.set("skill", skill);
      if (batch) params.set("batch", batch);
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: session?.user?.role === "admin",
  });

  if (status === "loading") return <p className="text-muted-foreground">Loading…</p>;
  if (session?.user?.role !== "admin") {
    return <p className="text-muted-foreground">This dashboard is restricted to AI Cell leadership.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">DAC Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">Search verified candidates by skill threshold and batch.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="skill">Filter by skill</Label>
          <Input id="skill" placeholder="e.g. pytorch" value={skill} onChange={(e) => setSkill(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="batch">Filter by batch</Label>
          <Input id="batch" placeholder="e.g. 2026-CS" value={batch} onChange={(e) => setBatch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{students?.length ?? 0} students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          <div className="divide-y">
            {students?.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.email} {s.githubHandle && `· github.com/${s.githubHandle}`} {s.batch && `· ${s.batch}`}
                  </p>
                </div>
                <div className="flex max-w-xs flex-wrap justify-end gap-1.5">
                  {s.skills.slice(0, 6).map((sk) => (
                    <Badge key={sk} variant="secondary">
                      {sk}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
