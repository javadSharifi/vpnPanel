export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="skeleton-pulse h-5 w-3/5 rounded bg-muted" />
      <div className="skeleton-pulse h-3 w-2/5 rounded bg-muted" />
      <div className="skeleton-pulse h-3 w-4/5 rounded bg-muted" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton-pulse h-7 w-12 rounded bg-muted" />
        <div className="skeleton-pulse h-7 w-12 rounded bg-muted" />
        <div className="skeleton-pulse h-7 w-12 rounded bg-muted" />
      </div>
    </div>
  );
}
