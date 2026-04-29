'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/shared/Header'
import type { Session, UserRole } from '@/types'

interface User {
  id: number
  email: string
  role: UserRole
  suspended: number
  created_at: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  graphiste: 'Graphiste',
  visiteur: 'Visiteur',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-brand-teal-light text-brand-teal',
  graphiste: 'bg-brand-green-light text-brand-green',
  visiteur: 'bg-background text-text-secondary',
}

const inputCls = 'rounded-[8px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 font-[inherit]'

export default function AdminClient({ session }: { session: Session }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', role: 'visiteur' as UserRole })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ email: '', password: '' })

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

  async function handleSuspend(id: number, suspended: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended }),
    })
    fetchUsers()
  }

  async function handleSaveEdit(id: number) {
    const body: Record<string, string> = {}
    if (editForm.email) body.email = editForm.email
    if (editForm.password) body.password = editForm.password
    if (!Object.keys(body).length) { setEditingId(null); return }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    setEditingId(null)
    fetchUsers()
  }

  async function handleDelete(user: User) {
    if (!confirm(`Supprimer définitivement ${user.email} ?`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchUsers()
  }

  function startEdit(user: User) {
    setEditingId(user.id)
    setEditForm({ email: '', password: '' })
  }

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
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
            >
              <div className="rounded-[12px] border border-border bg-surface p-5 flex flex-col gap-4" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-sm font-semibold text-text-primary">Nouvel utilisateur</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-xs font-medium text-text-secondary">Identifiant</label>
                    <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="prenom.nom" className={inputCls} />
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
                      <option value="admin">Admin</option>
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
              <motion.div key={user.id} layout className="flex flex-col rounded-[12px] border border-border bg-surface overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)', opacity: user.suspended ? 0.6 : 1 }}>
                {/* Ligne principale */}
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-brand-green flex items-center justify-center text-sm font-bold text-white">
                    {user.email[0].toUpperCase()}
                  </div>

                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
                      {user.suspended ? <span className="text-xs font-semibold text-brand-red bg-brand-red-light rounded-full px-2 py-0.5">Suspendu</span> : null}
                    </div>
                    <p className="text-xs text-text-disabled">Depuis le {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>

                  {user.id === session.userId && <span className="text-xs text-text-disabled shrink-0">(vous)</span>}

                  {/* Rôle */}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border-0 outline-none cursor-pointer shrink-0 ${ROLE_COLORS[user.role]}`}
                  >
                    <option value="visiteur">{ROLE_LABELS.visiteur}</option>
                    <option value="graphiste">{ROLE_LABELS.graphiste}</option>
                    <option value="admin">{ROLE_LABELS.admin}</option>
                  </select>

                  {/* Actions */}
                  {user.id !== session.userId && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Éditer */}
                      <button
                        onClick={() => editingId === user.id ? setEditingId(null) : startEdit(user)}
                        title="Modifier"
                        className="rounded-[8px] p-1.5 text-text-disabled hover:bg-background hover:text-text-primary transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Suspendre */}
                      <button
                        onClick={() => handleSuspend(user.id, !user.suspended)}
                        title={user.suspended ? 'Réactiver' : 'Suspendre'}
                        className={`rounded-[8px] p-1.5 transition-colors ${user.suspended ? 'text-brand-green hover:bg-brand-green-light' : 'text-text-disabled hover:bg-background hover:text-text-primary'}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {user.suspended
                            ? <><circle cx="12" cy="12" r="10"/><polyline points="10 8 16 12 10 16 10 8"/></>
                            : <><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></>
                          }
                        </svg>
                      </button>
                      {/* Supprimer */}
                      <button onClick={() => handleDelete(user)}
                        title="Supprimer"
                        className="rounded-[8px] p-1.5 text-text-disabled hover:bg-brand-red-light hover:text-brand-red transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Panneau d'édition */}
                <AnimatePresence>
                  {editingId === user.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 py-4 flex flex-col gap-3">
                        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wider">Modifier le compte</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-text-secondary">Nouvel identifiant</label>
                            <input type="text" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder={user.email} className={inputCls} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-text-secondary">Nouveau mot de passe</label>
                            <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              placeholder="••••••••" className={inputCls} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="rounded-[8px] border border-border bg-white px-3 py-1.5 text-sm text-text-secondary cursor-pointer font-[inherit]">
                            Annuler
                          </button>
                          <button onClick={() => handleSaveEdit(user.id)} className="rounded-[8px] bg-brand-green px-3 py-1.5 text-sm font-semibold text-white cursor-pointer font-[inherit]">
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
