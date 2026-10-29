import { BookOpen, ChevronDown, FileText } from 'lucide-react'
import { useId, useState } from 'react'

function SourceCard({ source, index }) {
  const [expanded, setExpanded] = useState(false)
  const long = source.content.length > 280
  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">[{index}]</span>
        <FileText className="size-3.5 text-slate-400" aria-hidden="true" />
        <span className="max-w-[16rem] truncate font-medium" title={source.filename}>
          {source.filename}
        </span>
        <span className="text-slate-500 dark:text-slate-400">· Page {source.page_number}</span>
        {/* score is cosine similarity (0–1) */}
        <span
          className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
          title={`Similarity score ${source.score}`}
        >
          {Math.round(source.score * 100)}% match
        </span>
      </div>
      <p className={`mt-2 text-xs leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300 ${expanded ? '' : 'line-clamp-4'}`}>
        {source.content}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 rounded text-xs font-medium text-indigo-600 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-indigo-400"
        >
          {expanded ? 'Show less' : 'Show full passage'}
        </button>
      )}
    </li>
  )
}

export default function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  if (!sources?.length) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <BookOpen className="size-3.5" aria-hidden="true" />
        Sources ({sources.length})
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ol id={panelId} className="mt-2 animate-fade-in space-y-2">
          {sources.map((s, i) => (
            <SourceCard key={`${s.document_id}-${s.page_number}-${i}`} source={s} index={i + 1} />
          ))}
        </ol>
      )}
    </div>
  )
}
