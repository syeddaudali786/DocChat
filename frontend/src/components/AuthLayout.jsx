import { FileUp, Quote, ShieldCheck } from 'lucide-react'
import Logo from './Logo'

const FEATURES = [
  { icon: FileUp, title: 'Upload your PDFs', text: 'Drop in reports, papers or manuals in seconds.' },
  { icon: Quote, title: 'Answers with sources', text: 'Every answer cites the file and page it came from.' },
  { icon: ShieldCheck, title: 'Private by default', text: 'Your documents and chats are visible only to you.' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh">
      {/* Brand panel (hidden on small screens) */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -top-32 -left-24 size-96 rounded-full bg-violet-400/30 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-24 -bottom-32 size-96 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-bold tracking-tight xl:text-5xl">Chat with your documents</h1>
          <p className="mt-4 text-lg text-indigo-100">
            Ask questions in plain language and get grounded answers from your own PDFs.
          </p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-indigo-100">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">Powered by retrieval-augmented generation.</p>
      </aside>

      {/* Form side */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
