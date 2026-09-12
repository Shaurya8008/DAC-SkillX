"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  opportunityType: string;
  requiredSkills: string[];
  createdBy: { fullName: string };
  createdAt: string;
};

const typeLabels: Record<string, string> = {
  hackathon: "Hackathon",
  research: "Research Lab",
  campus_role: "Campus Role",
  project: "Project",
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
        <Link href="/opportunities/new" className={cn(buttonVariants())}>
          Post an opportunity
        </Link>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && data?.length === 0 && (
        <p className="text-muted-foreground">No opportunities posted yet — be the first.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((o) => (
          <Link key={o.id} href={`/opportunities/${o.id}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{typeLabels[o.opportunityType] ?? o.opportunityType}</Badge>
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
        ))}
      </div>
    </div>
  );
}
