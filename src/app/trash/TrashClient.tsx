'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/shared/Header'
import type { Session, AssetWithDetails } from '@/types'

interface TrashAsset extends AssetWithDetails {
  deleted_at: string
}

function daysLeft(deletedAt: string): number {
  const deleted = new Date(deletedAt)
  const purgeDate = new Date(deleted)
  purgeDate.setDate(purgeDate.getDate() + 30)
  const diff = purgeDate.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function TrashClient({ session }: { session: Session }) {
  const [assets, setAssets] = useState<TrashAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [purging, setPurging] = useState(false)

  const fetchTrash = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assets/trash')
    const data = await res.json()
    setAssets(data.assets ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrash() }, [fetchTrash])

  async function handleRestore(id: number) {
    await fetch(`/api/assets/${id}/restore`, { method: 'POST' })
    fetchTrash()
  }

  async function handlePurgeNow() {
    if (!confirm('Purger définitivement tous les assets de la corbeille ? Cette action est irréversible.')) return
    setPurging(true)
    const res = await fetch('/api/assets/trash', { method: 'DELETE' })
    const data = await res.json()
    setPurging(false)
    alert(`${data.purged} asset(s) supprimé(s) définitivement.`)
    fetchTrash()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />

      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Corbeille</h1>
            <p className="text-sm text-text-secondary">Les assets sont purgés automatiquement après 30 jours.</p>
          </div>
          {assets.length > 0 && (
            <button
              onClick={handlePurgeNow}
              disabled={purging}
              className="rounded-[8px] border border-brand-red px-4 py-2 text-sm font-medium text-brand-red hover:bg-brand-red-light transition-colors disabled:opacity-60"
            >
              {purging ? 'Purge…' : `Vider la corbeille (${assets.length})`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-brand-teal border-t-transparent" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-text-disabled">La corbeille est vide.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {assets.map((asset) => {
                const days = daysLeft((asset as unknown as { deleted_at: string }).deleted_at)
                const urgent = days <= 5

                return (
                  <motion.div
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-4 rounded-[12px] border border-border bg-surface px-4 py-3"
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                  >
                    {/* Preview */}
                    <div className="h-12 w-12 shrink-0 rounded-[8px] bg-white flex items-center justify-center overflow-hidden">
                      {(asset.filetype === 'svg' || asset.filetype === 'png' || asset.filetype === 'ico') ? (
                        <img src={asset.filepath} alt={asset.filename} className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="text-xs text-text-disabled uppercase">{asset.filetype}</span>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{asset.filename}</p>
                      <p className="text-xs text-text-disabled uppercase">{asset.filetype}{asset.metadata?.brand ? ` · ${asset.metadata.brand}` : ''}</p>
                    </div>

                    {/* Jours restants */}
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      urgent ? 'bg-brand-red-light text-brand-red' : 'bg-background text-text-secondary'
                    }`}>
                      {days === 0 ? 'Purge imminente' : `${days}j restants`}
                    </span>

                    {/* Restaurer */}
                    <button
                      onClick={() => handleRestore(asset.id)}
                      className="shrink-0 rounded-[8px] bg-brand-green-light px-3 py-1.5 text-xs font-semibold text-brand-green hover:bg-brand-green hover:text-white transition-colors"
                    >
                      Restaurer
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
