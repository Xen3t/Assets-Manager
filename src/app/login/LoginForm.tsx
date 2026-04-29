'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erreur de connexion')
      return
    }

    router.push(from)
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e8eaed',
      padding: '0 16px',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: '384px' }}>
        {/* Titre */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
            Assets Manager
          </h1>
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
            Connecte-toi pour accéder à la bibliothèque
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#f1f3f5',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                Email
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identifiant"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#1f2937',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Mot de passe */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#1f2937',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Erreur */}
            {error && (
              <p style={{
                borderRadius: '8px',
                backgroundColor: '#fde8ea',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#d84150',
                margin: 0,
              }}>
                {error}
              </p>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '4px',
                borderRadius: '8px',
                backgroundColor: loading ? '#8ab54a' : '#5d9228',
                border: 'none',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
          <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            Continuer en tant que visiteur →
          </a>
        </p>
      </div>
    </div>
  )
}
