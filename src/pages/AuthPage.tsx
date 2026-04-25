import { useState, FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { AuthView } from '../types'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (view === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err.message)
    } else {
      if (!displayName.trim()) {
        setError('Please enter your name')
        setSubmitting(false)
        return
      }
      const err = await signUp(email, password, displayName)
      if (err) setError(err.message)
    }

    setSubmitting(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" fill="#2563eb" stroke="#3b82f6" strokeWidth="1"/>
              <path d="M16 8C11.58 8 8 11.58 8 16C8 17.85 8.61 19.56 9.63 20.94L8 24L11.33 22.56C12.63 23.46 14.25 24 16 24C20.42 24 24 20.42 24 16C24 11.58 20.42 8 16 8Z" fill="white" fillOpacity="0.9"/>
              <circle cx="12.5" cy="16" r="1.5" fill="#2563eb"/>
              <circle cx="16" cy="16" r="1.5" fill="#2563eb"/>
              <circle cx="19.5" cy="16" r="1.5" fill="#2563eb"/>
            </svg>
          </div>
          <div>
            <h1 className="auth-title">Doc Comfort's Brain</h1>
            <p className="auth-subtitle">Your HVAC & Building Science AI Assistant</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${view === 'login' ? 'active' : ''}`}
            onClick={() => { setView('login'); setError('') }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${view === 'register' ? 'active' : ''}`}
            onClick={() => { setView('register'); setError('') }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {view === 'register' && (
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="John Smith"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={view === 'register' ? 'Minimum 6 characters' : 'Your password'}
              required
              minLength={6}
              autoComplete={view === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : view === 'login'
              ? 'Sign In'
              : 'Create Account'
            }
          </button>
        </form>

        <p className="auth-footer">
          Powered by Claude AI &middot; HVACR &amp; Building Science
        </p>
      </div>
    </div>
  )
}
