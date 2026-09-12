import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  GitFork,
  ShieldCheck,
  Sparkles,
  Target,
  Users2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { LiquidBackground } from "@/components/liquid-background";

const personas = [
  {
    icon: Users2,
    title: "Undergraduate Students",
    body: "Get a verified Readiness Score and targeted opportunity recommendations — matched via embeddings, not resume keywords.",
  },
  {
    icon: Target,
    title: "Project & Hackathon Leads",
    body: "Search verified student profiles instantly, with transparent competency match percentages for every candidate.",
  },
  {
    icon: ShieldCheck,
    title: "AI Cell Leadership",
    body: "A centralized talent dashboard with batch analytics and automated shortlisting — no more blind recruitment drives.",
  },
];

const steps = [
  {
    icon: GitFork,
    title: "Build a verified profile",
    body: "Add your skills, then back them up — analyze a public repo or pass a 5-question diagnostic quiz per skill.",
  },
  {
    icon: Sparkles,
    title: "Get scored, not guessed",
    body: "Every match runs a hybrid score: 60% exact hard-skill overlap, 40% semantic similarity between your profile and the brief.",
  },
  {
    icon: FlaskConical,
    title: "Get matched to real opportunities",
    body: "Hackathons, funded research labs, and club roles — ranked by transparent, explainable match percentages.",
  },
];

export default function Home() {
  return (
    <div className="space-y-24">
      <section className="relative -mx-6 -mt-10 overflow-hidden px-6 pt-20 pb-16 text-center sm:pt-28">
        <LiquidBackground className="-z-20" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="mx-auto max-w-2xl space-y-6">
          <Reveal>
            <div className="glass mx-auto flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              DGU AI Cell (DAC)
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Prove your skills.
              <br />
              <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                Don&apos;t just claim them.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto max-w-xl text-muted-foreground">
              DAC SkillX replaces self-reported resumes with an AI-driven assessment: GitHub repo inspection, adaptive
              diagnostics, and vector-space opportunity matching.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}>
                Build your profile
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/opportunities"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "glass glass-interactive")}
              >
                Browse opportunities
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="space-y-8">
        <Reveal className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Three steps from self-reported skills to a verified, matchable profile.
          </p>
        </Reveal>
        <RevealGroup className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <RevealItem key={s.title} index={i}>
              <TiltCard className="glass h-full rounded-xl p-5">
                <span className="absolute -top-3 -left-1 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <s.icon className="mb-3 size-5 text-primary" />
                <h3 className="font-medium">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <RevealGroup className="grid gap-4 sm:grid-cols-3">
        {personas.map((p, i) => (
          <RevealItem key={p.title} index={i}>
            <TiltCard className="h-full">
              <Card className="glass h-full transition-shadow hover:shadow-sm">
                <CardHeader>
                  <p.icon className="mb-1 size-5 text-primary" />
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{p.body}</CardDescription>
                </CardContent>
              </Card>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
