"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Plus, Rocket, Sparkles, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/skeleton";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  opportunityType: string;
  requiredSkills: string[];
  createdBy: { fullName: string };
  createdAt: string;
};

const TYPE_META: Record<string, { label: string; icon: typeof Rocket }> = {
  hackathon: { label: "Hackathon", icon: Rocket },
  research: { label: "Research Lab", icon: FlaskConical },
  campus_role: { label: "Campus Role", icon: Users2 },
  project: { label: "Project", icon: Sparkles },
};

export default function OpportunitiesPage() {
  const { data, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const res = await fetch("/api/opportunities");
      if (!res.ok) throw new Error("Failed to load opportunities");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Opportunity Board</h1>
          <p className="text-sm text-muted-foreground">Hackathons, research labs, and club roles.</p>
        </div>
        <Link href="/opportunities/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          Post
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Rocket className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No opportunities posted yet</p>
            <p className="text-sm text-muted-foreground">Be the first to post a hackathon, research role, or project.</p>
          </div>
          <Link href="/opportunities/new" className={cn(buttonVariants(), "mt-1")}>
            Post an opportunity
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((o) => {
          const meta = TYPE_META[o.opportunityType];
          const Icon = meta?.icon ?? Sparkles;
          return (
            <Link key={o.id} href={`/opportunities/${o.id}`}>
              <Card className="h-full transition-all hover:border-primary hover:shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="gap-1">
                      <Icon className="size-3" />
                      {meta?.label ?? o.opportunityType}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{o.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{o.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {o.requiredSkills.slice(0, 5).map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Posted by {o.createdBy.fullName}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
