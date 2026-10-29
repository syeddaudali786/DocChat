import { SendHorizonal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Spinner from './Spinner'

const MAX_LENGTH = 2000 // backend limit

export default function ChatInput({ onSend, sending, disabled, disabledReason }) {
  const [value, setValue] = useState('')
  const ref = useRef(null)
  const canSend = !disabled && !sending && value.trim().length > 0

  // Grow with the content, up to a max height.
  useEffect(() => {
    const el = ref.current
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  function submit() {
    if (!canSend) return
    onSend(value.trim())
    setValue('')
  }

  return (
    <div className="border-t border-slate-200 bg-white/80 px-4 pt-3 pb-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="mx-auto max-w-3xl"
      >
        <div
          className={`flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 dark:bg-slate-900 ${
            disabled ? 'border-slate-200 opacity-70 dark:border-slate-800' : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask a question
          </label>
          <textarea
            id="chat-input"
            ref={ref}
            rows={1}
            value={value}
            maxLength={MAX_LENGTH}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a newline. Ignore Enter while composing (IME).
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={disabled ? 'Upload a document to start asking questions' : 'Ask a question about your documents…'}
            aria-describedby="chat-input-hint"
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send question"
            className="btn-primary size-10 shrink-0 rounded-xl p-0"
          >
            {sending ? <Spinner /> : <SendHorizonal className="size-4" />}
          </button>
        </div>
        <p id="chat-input-hint" className="mt-2 flex justify-between gap-4 px-1 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {disabled ? disabledReason : (
              <>
                <kbd className="font-sans font-semibold">Enter</kbd> to send, <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new line
              </>
            )}
          </span>
          {value.length > MAX_LENGTH * 0.8 && (
            <span className={value.length >= MAX_LENGTH ? 'text-red-600' : ''}>
              {value.length}/{MAX_LENGTH}
            </span>
          )}
        </p>
      </form>
    </div>
  )
}
