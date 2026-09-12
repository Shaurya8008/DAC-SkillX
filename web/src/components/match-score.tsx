import { cn } from "@/lib/utils";

function tone(score: number) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 40) return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
}

export function MatchScoreBadge({ score, label }: { score: number; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tone(score))}>
      {score.toFixed(1)}%{label && <span className="opacity-70">· {label}</span>}
    </span>
  );
}

export function MatchScoreStat({ label, value, size = "default" }: { label: string; value: number; size?: "default" | "lg" }) {
  return (
    <div className="text-center">
      <p className={cn("font-semibold", tone(value).split(" ")[0], size === "lg" ? "text-3xl" : "text-lg")}>
        {value.toFixed(1)}%
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
