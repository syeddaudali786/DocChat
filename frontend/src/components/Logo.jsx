import { FileText } from 'lucide-react'

export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid size-9 place-items-center rounded-xl shadow-md ${
          light ? 'bg-white/15 ring-1 ring-white/25' : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30'
        }`}
      >
        <FileText className="size-5 text-white" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
        DocChat
      </span>
    </div>
  )
}
