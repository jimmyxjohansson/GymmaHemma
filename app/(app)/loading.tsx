export default function Loading() {
  return (
    <div className="space-y-3 pt-2" aria-busy="true">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-surface" />
      <div className="h-32 animate-pulse rounded-2xl bg-surface" />
      <div className="h-20 animate-pulse rounded-2xl bg-surface" />
      <div className="h-20 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
