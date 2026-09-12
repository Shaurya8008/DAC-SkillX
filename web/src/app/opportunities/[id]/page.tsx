"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitFork, Sparkles, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";
import { MatchScoreStat } from "@/components/match-score";

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

const typeLabels: Record<string, string> = {
  hackathon: "Hackathon",
  research: "Research Lab",
  campus_role: "Campus Role",
  project: "Project",
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (!opportunity) return <p className="text-muted-foreground">Opportunity not found.</p>;

  const isOwner = session?.user?.id === opportunity.createdById || session?.user?.role === "admin";
  const myMatch = !isOwner ? matches?.[0] : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline">{typeLabels[opportunity.opportunityType] ?? opportunity.opportunityType}</Badge>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Your match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myMatch ? (
              <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4">
                <MatchScoreStat label="Final score" value={myMatch.finalScore} size="lg" />
                <MatchScoreStat label="Hard skill overlap" value={myMatch.hardSkillScore} />
                <MatchScoreStat label="Semantic fit" value={myMatch.semanticScore} />
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" />
              Ranked candidates
            </CardTitle>
            <CardDescription>Students who have computed their match against this opportunity.</CardDescription>
          </CardHeader>
          <CardContent>
            {!matches || matches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <Users className="size-8 opacity-40" />
                No candidates yet — share this opportunity to get matches.
              </div>
            ) : (
              <div className="divide-y">
                {matches.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium">{m.student?.fullName}</p>
                        {m.student?.githubHandle && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GitFork className="size-3" />
                            {m.student.githubHandle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <MatchScoreStat label="Hard" value={m.hardSkillScore} />
                      <MatchScoreStat label="Semantic" value={m.semanticScore} />
                      <MatchScoreStat label="Final" value={m.finalScore} />
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
