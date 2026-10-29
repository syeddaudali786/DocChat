import { AlertCircle, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { useToast } from '../context/ToastContext'

const MAX_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 10

function checkFile(file) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Only PDF files are accepted.'
  if (file.size > MAX_MB * 1024 * 1024) return `File is larger than ${MAX_MB} MB.`
  if (file.size === 0) return 'The file is empty.'
  return null
}

export default function UploadBox({ onUpload }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(null) // { name, percent, index, count }
  const [error, setError] = useState(null)
  const busy = progress !== null

  async function uploadFiles(fileList) {
    const files = Array.from(fileList)
    if (!files.length || busy) return
    setError(null)
    const failures = []

    for (const [index, file] of files.entries()) {
      const problem = checkFile(file)
      if (problem) {
        failures.push(`${file.name}: ${problem}`)
        continue
      }
      setProgress({ name: file.name, percent: 0, index: index + 1, count: files.length })
      try {
        await onUpload(file, (percent) => setProgress((p) => p && { ...p, percent }))
        toast.success(`Uploaded “${file.name}”. Processing has started.`)
      } catch (err) {
        // 415 not a PDF, 413 too large, 422 scanned/empty/encrypted: the API message is user-friendly
        failures.push(`${file.name}: ${getErrorMessage(err)}`)
      }
    }

    setProgress(null)
    if (failures.length) {
      setError(failures.join('\n'))
      toast.error(failures.length === 1 ? 'Upload failed.' : `${failures.length} uploads failed.`)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    uploadFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        aria-label={`Upload PDF documents, up to ${MAX_MB} MB each`}
        onClick={() => !busy && inputRef.current.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !busy && (e.preventDefault(), inputRef.current.click())}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-4 text-center transition focus-visible:ring-4 focus-visible:ring-indigo-500/30 focus-visible:outline-none ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-slate-800/50'
        } ${busy ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {busy ? (
          <div aria-live="polite">
            <p className="truncate text-sm font-medium" title={progress.name}>
              Uploading {progress.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {progress.count > 1 && `File ${progress.index} of ${progress.count} · `}
              {progress.percent < 100 ? `${progress.percent}%` : 'Reading PDF…'}
            </p>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto size-6 text-indigo-500" aria-hidden="true" />
            <p className="mt-1.5 text-sm font-medium">
              <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">PDF only, up to {MAX_MB} MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          uploadFiles(e.target.files)
          e.target.value = '' // allow picking the same file again
        }}
      />
      {error && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs whitespace-pre-line text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-semibold underline" aria-label="Dismiss upload error">
            OK
          </button>
        </div>
      )}
    </div>
  )
}
