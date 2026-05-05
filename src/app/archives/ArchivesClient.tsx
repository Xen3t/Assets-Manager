'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/shared/Header'
import AssetCard from '@/components/library/AssetCard'
import AssetDetailModal from '@/components/library/AssetDetailModal'
import type { AssetWithDetails, Session, AssetStatus } from '@/types'

export default function ArchivesClient({ session }: { session: Session }) {
  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/assets?status=archived')
    const data = await res.json()
    setAssets(data.assets ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  async function handleStatusChange(id: number, status: AssetStatus | 'active') {
    if (status === 'deleted') {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    }
    fetchAssets()
  }

  function handleSaved(updated?: AssetWithDetails) {
    if (updated) setSelectedAsset(updated)
    fetchAssets()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />

      <main className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Archives</h1>
          <p className="text-sm text-text-secondary">{assets.length} asset{assets.length !== 1 ? 's' : ''} archivé{assets.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-brand-teal border-t-transparent" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-text-secondary">Aucun asset archivé</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <AnimatePresence>
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onClick={setSelectedAsset} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AssetDetailModal
        asset={selectedAsset}
        isGraphiste={true}
        onClose={() => setSelectedAsset(null)}
        onSaved={handleSaved}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
