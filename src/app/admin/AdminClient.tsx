'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/shared/Header'
import type { Session, UserRole } from '@/types'

interface User {
  id: number
  email: string
  role: UserRole
  created_at: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  graphiste: 'Graphiste',
  visiteur: 'Visiteur',
}

const ROLE_COLORS: Record<UserRole, string> = {
  graphiste: 'bg-brand-green-light text-brand-green',
  visiteur: 'bg-background text-text-secondary',
}

export default function AdminClient({ session }: { session: Session }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', role: 'visiteur' as UserRole })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleCreate() {
    setError(null)
    setSaving(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setShowForm(false)
    setForm({ email: '', password: '', role: 'visiteur' })
    fetchUsers()
  }

  async function handleRoleChange(id: number, role: UserRole) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchUsers()
  }

  async function handleDelete(user: User) {
    if (!confirm(`Supprimer ${user.email} ?`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchUsers()
  }

  const inputCls = 'rounded-[8px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />

      <main className="flex flex-1 flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Gestion des utilisateurs</h1>
            <p className="text-sm text-text-secondary">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-[8px] bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
          >
            {showForm ? 'Annuler' : '+ Nouvel utilisateur'}
          </button>
        </div>

        {/* Formulaire création */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[12px] border border-border bg-surface p-5 flex flex-col gap-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-sm font-semibold text-text-primary">Nouvel utilisateur</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-xs font-medium text-text-secondary">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="prenom.nom@hoortrade.com" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">Mot de passe</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">Rôle</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={inputCls}>
                      <option value="visiteur">Visiteur</option>
                      <option value="graphiste">Graphiste</option>
                    </select>
                  </div>
                </div>
                {error && <p className="rounded-[8px] bg-brand-red-light px-3 py-2 text-sm text-brand-red">{error}</p>}
                <button onClick={handleCreate} disabled={saving || !form.email || !form.password}
                  className="self-end rounded-[8px] bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-hover disabled:opacity-60 transition-colors">
                  {saving ? 'Création…' : 'Créer'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste utilisateurs */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-brand-teal border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <motion.div key={user.id} layout
                className="flex items-center gap-4 rounded-[12px] border border-border bg-surface px-4 py-3"
                style={{ boxShadow: 'var(--shadow-sm)' }}>
                {/* Avatar */}
                <div className="h-9 w-9 shrink-0 rounded-full bg-brand-green flex items-center justify-center text-sm font-bold text-white">
                  {user.email[0].toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex flex-1 flex-col min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
                  <p className="text-xs text-text-disabled">Depuis le {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                </div>

                {/* Toi-même */}
                {user.id === session.userId && (
                  <span className="text-xs text-text-disabled">(vous)</span>
                )}

                {/* Rôle */}
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${ROLE_COLORS[user.role]}`}
                >
                  <option value="visiteur">{ROLE_LABELS.visiteur}</option>
                  <option value="graphiste">{ROLE_LABELS.graphiste}</option>
                </select>

                {/* Supprimer */}
                {user.id !== session.userId && (
                  <button onClick={() => handleDelete(user)}
                    className="shrink-0 rounded-[8px] p-1.5 text-text-disabled hover:bg-brand-red-light hover:text-brand-red transition-colors">
                    🗑
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
