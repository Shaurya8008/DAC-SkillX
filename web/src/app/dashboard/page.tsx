"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Compass, GitFork, Sparkles, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CardSkeleton, Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";

type Profile = {
  fullName: string;
  skills: string[];
  verifiedSkills: string[];
  bio: string | null;
  githubHandle: string | null;
};
type Opportunity = { id: string; title: string; opportunityType: string; requiredSkills: string[] };

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/profile")).json(),
    enabled: !!session?.user,
  });

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => (await fetch("/api/opportunities")).json(),
  });

  const recommended = (opportunities ?? [])
    .filter((o) => o.requiredSkills.some((s) => profile?.skills.some((ps) => ps.toLowerCase() === s.toLowerCase())))
    .slice(0, 4);

  const verifiedCount = profile
    ? profile.skills.filter((s) => profile.verifiedSkills.some((v) => v.toLowerCase() === s.toLowerCase())).length
    : 0;
  const readiness = profile ? Math.round((verifiedCount / Math.max(1, profile.skills.length)) * 100) : null;
  const profileIncomplete = !!profile && profile.skills.length === 0 && !profile.githubHandle;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back{profileLoading ? "" : profile ? `, ${profile.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Your verified skill profile and recommended opportunities.</p>
      </div>

      {profileIncomplete && (
        <Card className="glass border-primary/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <UserCog className="size-8 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Your profile is empty</p>
                <p className="text-sm text-muted-foreground">
                  Upload your resume or add skills by hand, plus your GitHub handle, so we can recommend opportunities
                  and start verifying you.
                </p>
              </div>
            </div>
            <Link href="/profile" className={cn(buttonVariants(), "gap-1.5")}>
              <GitFork className="size-4" />
              Complete your profile
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Readiness score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <p className="text-3xl font-semibold">{readiness ?? 0}%</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {verifiedCount} of {profile?.skills.length ?? 0} skills verified
            </p>
          </CardContent>
        </Card>

        <Card className="glass sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Your skill tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profileLoading && <Skeleton className="h-5 w-40" />}
            {!profileLoading && profile && profile.skills.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add skills on your{" "}
                <Link href="/profile" className="underline">
                  profile
                </Link>{" "}
                to unlock recommendations.
              </p>
            )}
            {profile?.skills.map((s) => (
              <Badge
                key={s}
                variant={profile.verifiedSkills.some((v) => v.toLowerCase() === s.toLowerCase()) ? "default" : "secondary"}
              >
                {s}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
          <Sparkles className="size-4 text-primary" />
          Recommended for you
        </h2>
        {opportunitiesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : recommended.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            <Compass className="size-6 opacity-40" />
            No hard-skill matches yet.{" "}
            <Link href="/opportunities" className="underline">
              Browse the full opportunity board
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recommended.map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`}>
                <Card className="glass glass-interactive h-full">
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
