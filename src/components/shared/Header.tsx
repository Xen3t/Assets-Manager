'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Session } from '@/types'

const MENU_ITEMS = [
  { href: '/admin', label: 'Utilisateurs', roles: ['admin'] },
  { href: '/archives', label: 'Archives', roles: ['admin', 'graphiste'] },
  { href: '/trash', label: 'Corbeille', roles: ['admin', 'graphiste'] },
] as const

const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb',
  backgroundColor: '#fff', padding: '8px 12px', fontSize: '14px',
  color: '#1f2937', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function Header({ session }: { session: Session | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function openPwdModal() {
    setOpen(false)
    setCurrentPwd('')
    setNewPwd('')
    setPwdError(null)
    setPwdSuccess(false)
    setShowPwdModal(true)
  }

  async function handleChangePassword() {
    if (!currentPwd || !newPwd) { setPwdError('Remplis les deux champs'); return }
    setPwdSaving(true)
    setPwdError(null)
    const res = await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    })
    const data = await res.json()
    setPwdSaving(false)
    if (!res.ok) { setPwdError(data.error); return }
    setPwdSuccess(true)
    setTimeout(() => setShowPwdModal(false), 1500)
  }

  const canChangePassword = session?.role === 'admin' || session?.role === 'graphiste'
  const visibleMenuItems = MENU_ITEMS.filter((n) => session && (n.roles as readonly string[]).includes(session.role))

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-border bg-surface px-6">
        <Link href="/" className="text-base font-semibold text-text-primary shrink-0 flex-1 transition-colors">
          Assets <span className="font-bold text-brand-green">Manager</span>
        </Link>

        {!session ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-disabled">Mode visiteur</span>
            <Link
              href="/login"
              className="rounded-[8px] bg-brand-green px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover"
            >
              Se connecter
            </Link>
          </div>
        ) : (
        <div className="relative shrink-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-background"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
              {session.email[0].toUpperCase()}
            </span>
            <span className="max-w-40 truncate">{session.email}</span>
            <span className="text-xs text-text-disabled">▾</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div
                className="absolute right-0 top-10 z-20 w-52 rounded-[12px] border border-border bg-surface p-1"
                style={{ boxShadow: 'var(--shadow-default)' }}
              >
                <div className="px-3 py-2 text-xs text-text-disabled capitalize">{session?.role}</div>
                {visibleMenuItems.length > 0 && (
                  <>
                    <div className="my-1 h-px bg-border" />
                    {visibleMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block w-full rounded-[8px] px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
                {canChangePassword && (
                  <>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={openPwdModal}
                      className="w-full rounded-[8px] px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
                    >
                      Changer mon mot de passe
                    </button>
                  </>
                )}
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="w-full rounded-[8px] px-3 py-2 text-left text-sm text-brand-red transition-colors hover:bg-brand-red-light"
                >
                  Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
        )}
      </header>

      {/* Modal changement de mot de passe */}
      <AnimatePresence>
        {showPwdModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPwdModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
              onClick={() => setShowPwdModal(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', backgroundColor: '#f1f3f5', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden' }}
              >
                <div style={{ padding: '20px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937', margin: 0 }}>Changer mon mot de passe</p>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {pwdSuccess ? (
                    <p style={{ textAlign: 'center', color: '#5d9228', fontWeight: 600, fontSize: '14px' }}>Mot de passe mis à jour ✓</p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mot de passe actuel</label>
                        <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} style={inputStyle} placeholder="••••••••" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nouveau mot de passe</label>
                        <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} style={inputStyle} placeholder="••••••••" />
                      </div>
                      {pwdError && <p style={{ fontSize: '13px', color: '#d84150', backgroundColor: '#fde8ea', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>{pwdError}</p>}
                    </>
                  )}
                </div>
                {!pwdSuccess && (
                  <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => setShowPwdModal(false)} style={{ fontSize: '14px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Annuler
                    </button>
                    <button onClick={handleChangePassword} disabled={pwdSaving} style={{ fontSize: '14px', fontWeight: 600, color: '#fff', backgroundColor: pwdSaving ? '#8ab54a' : '#5d9228', border: 'none', borderRadius: '8px', padding: '8px 18px', cursor: pwdSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {pwdSaving ? 'Enregistrement…' : 'Confirmer'}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
