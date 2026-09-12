import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const personas = [
  {
    title: "Undergraduate Students",
    body: "Get a verified Readiness Score and targeted opportunity recommendations — matched via embeddings, not resume keywords.",
  },
  {
    title: "Project & Hackathon Leads",
    body: "Search verified student profiles instantly, with transparent competency match percentages for every candidate.",
  },
  {
    title: "AI Cell Leadership",
    body: "A centralized talent dashboard with batch analytics and automated shortlisting — no more blind recruitment drives.",
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="space-y-6 text-center">
        <p className="text-sm font-medium text-primary">DGU AI Cell (DAC)</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">DAC SkillX Platform</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          AI-powered student skill assessment & opportunity matching engine. Replacing self-reported resumes with
          verified skill profiles, adaptive diagnostics, and vector-space opportunity matching.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Build your profile
          </Link>
          <Link href="/opportunities" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Browse opportunities
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {personas.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-base">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{p.body}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
