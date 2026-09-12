"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  opportunityType: string;
  requiredSkills: string[];
  createdById: string;
  createdBy: { fullName: string };
};

type Match = {
  id: string;
  studentId: string;
  hardSkillScore: number;
  semanticScore: number;
  finalScore: number;
  status: string;
  student?: { fullName: string; githubHandle: string | null; email: string };
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities/${id}`);
      if (!res.ok) throw new Error("Failed to load opportunity");
      return res.json();
    },
  });

  const { data: matches } = useQuery<Match[]>({
    queryKey: ["matches", id],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities/${id}/matches`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.user,
  });

  const computeMatch = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/opportunities/${id}/matches`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to compute match");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches", id] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!opportunity) return <p className="text-muted-foreground">Opportunity not found.</p>;

  const isOwner = session?.user?.id === opportunity.createdById || session?.user?.role === "admin";
  const myMatch = !isOwner ? matches?.[0] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline">{opportunity.opportunityType}</Badge>
        <h1 className="mt-2 text-2xl font-semibold">{opportunity.title}</h1>
        <p className="text-sm text-muted-foreground">Posted by {opportunity.createdBy.fullName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brief</CardTitle>
          <CardDescription className="whitespace-pre-wrap text-foreground">
            {opportunity.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {opportunity.requiredSkills.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {!isOwner && session?.user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myMatch ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <Stat label="Final score" value={myMatch.finalScore} highlight />
                <Stat label="Hard skill overlap" value={myMatch.hardSkillScore} />
                <Stat label="Semantic fit" value={myMatch.semanticScore} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You haven&apos;t computed a match yet.</p>
            )}
            <Button onClick={() => computeMatch.mutate()} disabled={computeMatch.isPending}>
              {computeMatch.isPending ? "Computing…" : myMatch ? "Recompute match" : "Compute my match"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranked candidates</CardTitle>
            <CardDescription>Students who have computed their match against this opportunity.</CardDescription>
          </CardHeader>
          <CardContent>
            {!matches || matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No candidates yet.</p>
            ) : (
              <div className="divide-y">
                {matches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{m.student?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.student?.githubHandle}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <Stat label="Hard" value={m.hardSkillScore} compact />
                      <Stat label="Semantic" value={m.semanticScore} compact />
                      <Stat label="Final" value={m.finalScore} compact highlight />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, compact }: { label: string; value: number; highlight?: boolean; compact?: boolean }) {
  return (
    <div className={compact ? "text-center" : ""}>
      <p className={`font-semibold ${highlight ? "text-primary" : ""} ${compact ? "text-sm" : "text-2xl"}`}>
        {value.toFixed(1)}%
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
