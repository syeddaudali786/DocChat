// Placeholder rows shown while a list loads.
export default function Skeleton({ rows = 3, className = 'h-12' }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800 ${className}`} />
      ))}
    </div>
  )
}
