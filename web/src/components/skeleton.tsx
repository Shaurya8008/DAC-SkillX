import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}
