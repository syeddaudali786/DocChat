import { AlertCircle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import PasswordInput from './PasswordInput'
import Spinner from './Spinner'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue to your documents.',
    submit: 'Sign in',
    switchText: "Don't have an account?",
    switchLink: 'Create one',
    switchTo: '/register',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Start chatting with your PDFs in under a minute.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchTo: '/login',
  },
}

function validate(mode, email, password) {
  const errors = {}
  if (!email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.'

  if (!password) errors.password = 'Password is required.'
  else if (mode === 'register') {
    // Backend limits: at least 8 characters, at most 72 bytes (bcrypt)
    if (password.length < 8) errors.password = 'Use at least 8 characters.'
    else if (new TextEncoder().encode(password).length > 72) errors.password = 'Password is too long (max 72 bytes).'
  }
  return errors
}

export default function AuthForm({ mode }) {
  const copy = COPY[mode]
  const { login, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  const errors = validate(mode, email, password)
  const showError = (field) => (touched[field] || submitted) && errors[field]

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    setApiError(null)
    if (Object.keys(errors).length) return

    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
        toast.success('Account created. Welcome aboard!')
      } else {
        await login(email.trim(), password)
      }
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      if (error.afterRegister) {
        // Registration worked but automatic sign-in did not (e.g. rate limit).
        toast.success('Account created. Please sign in.')
        navigate('/login', { replace: true, state: { email: email.trim() } })
        return
      }
      setApiError(
        getErrorMessage(error, {
          401: 'Incorrect email or password.',
          409: 'An account with this email already exists.',
          429: 'Too many sign-in attempts. Please wait a minute and try again.',
        }),
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-bold tracking-tight">{copy.title}</h2>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{copy.subtitle}</p>

      {apiError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {apiError}
            {mode === 'register' && apiError.includes('already exists') && (
              <>
                {' '}
                <Link to="/login" state={{ email: email.trim() }} className="font-semibold underline">
                  Sign in instead
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus={!email}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={Boolean(showError('email'))}
            aria-describedby={showError('email') ? 'email-error' : undefined}
            className={`input ${showError('email') ? 'input-error' : ''}`}
          />
          {showError('email') && (
            <p id="email-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            autoFocus={Boolean(email)}
            placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            invalid={Boolean(showError('password'))}
            aria-invalid={Boolean(showError('password'))}
            aria-describedby={showError('password') ? 'password-error' : undefined}
          />
          {showError('password') && (
            <p id="password-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? (
            <>
              <Spinner /> {mode === 'register' ? 'Creating account…' : 'Signing in…'}
            </>
          ) : (
            <>
              {copy.submit} <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {copy.switchText}{' '}
        <Link
          to={copy.switchTo}
          className="rounded font-semibold text-indigo-600 hover:text-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-indigo-400"
        >
          {copy.switchLink}
        </Link>
      </p>
    </div>
  )
}
