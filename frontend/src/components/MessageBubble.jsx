import { Sparkles } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SourcesPanel from './SourcesPanel'

const markdownComponents = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
}

function AssistantAvatar() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
      <Sparkles className="size-4 text-white" aria-hidden="true" />
    </span>
  )
}

export default function MessageBubble({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex animate-fade-in justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm whitespace-pre-wrap text-white shadow-md shadow-indigo-500/20 sm:max-w-[75%]">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex animate-fade-in gap-3">
      <AssistantAvatar />
      <div className="min-w-0 max-w-[85%] flex-1 sm:max-w-[80%]">
        <div className="markdown rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </Markdown>
        </div>
        <SourcesPanel sources={message.sources} />
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex animate-fade-in gap-3" role="status" aria-label="Assistant is typing">
      <AssistantAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="size-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  )
}
