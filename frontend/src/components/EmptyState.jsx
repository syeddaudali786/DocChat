import { ArrowUpRight, FileUp, Sparkles } from 'lucide-react'

const EXAMPLES = [
  'Summarize the key points of my documents.',
  'What are the main conclusions or recommendations?',
  'List any important dates, numbers or deadlines mentioned.',
]

export default function EmptyState({ hasReadyDocs, hasAnyDocs, onAsk, onOpenSidebar }) {
  return (
    <div className="mx-auto flex max-w-2xl animate-fade-in flex-col items-center px-4 py-12 text-center sm:py-20">
      <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
        <Sparkles className="size-7 text-white" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">What would you like to know?</h2>

      {hasReadyDocs ? (
        <>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Ask anything about your documents. Answers cite the exact file and page they came from.
          </p>
          <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
            {EXAMPLES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAsk(q)}
                className="group flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:ring-4 focus-visible:ring-indigo-500/30 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
              >
                <span className="text-slate-700 dark:text-slate-200">{q}</span>
                <ArrowUpRight className="size-4 text-slate-400 transition group-hover:text-indigo-500" aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {hasAnyDocs
              ? 'Your documents are still processing. You can ask questions as soon as one is ready.'
              : 'Upload a PDF to get started. Once it is processed, you can ask questions about it here.'}
          </p>
          <button type="button" onClick={onOpenSidebar} className="btn-primary mt-8 lg:hidden">
            <FileUp className="size-4" aria-hidden="true" /> Upload a PDF
          </button>
        </>
      )}
    </div>
  )
}
