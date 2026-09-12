"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Profile = { fullName: string; skills: string[]; bio: string | null };
type Opportunity = { id: string; title: string; opportunityType: string; requiredSkills: string[] };

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/profile")).json(),
    enabled: !!session?.user,
  });

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => (await fetch("/api/opportunities")).json(),
  });

  const recommended = (opportunities ?? [])
    .filter((o) => o.requiredSkills.some((s) => profile?.skills.some((ps) => ps.toLowerCase() === s.toLowerCase())))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back{profile ? `, ${profile.fullName.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-muted-foreground">
          Your verified skill profile and recommended opportunities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your skill tags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profile && profile.skills.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add skills on your <Link href="/profile" className="underline">profile</Link> to unlock recommendations.
            </p>
          )}
          {profile?.skills.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recommended for you</h2>
        {recommended.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hard-skill matches yet. Browse the full{" "}
            <Link href="/opportunities" className="underline">
              opportunity board
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <Badge variant="outline">{o.opportunityType}</Badge>
                    <CardTitle className="text-base">{o.title}</CardTitle>
                    <CardDescription>{o.requiredSkills.join(", ")}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
