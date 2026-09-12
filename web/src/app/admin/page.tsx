"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { GitFork, ShieldAlert, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RowSkeleton, Skeleton } from "@/components/skeleton";

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

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (session?.user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
        <ShieldAlert className="size-8 opacity-40" />
        This dashboard is restricted to AI Cell leadership.
      </div>
    );
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            {students?.length ?? 0} students
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="divide-y">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </div>
          )}
          {!isLoading && students?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No students match these filters.</p>
          )}
          <div className="divide-y">
            {students?.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{s.fullName}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{s.email}</span>
                    {s.githubHandle && (
                      <span className="flex items-center gap-1">
                        <GitFork className="size-3" />
                        {s.githubHandle}
                      </span>
                    )}
                    {s.batch && <span>· {s.batch}</span>}
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
