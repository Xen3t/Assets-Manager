'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/shared/Header'
import FilterBar, { type Filters } from '@/components/library/FilterBar'
import AssetCard from '@/components/library/AssetCard'
import AssetDetailModal from '@/components/library/AssetDetailModal'
import type { AssetWithDetails, Session, AssetStatus } from '@/types'

export default function LibraryClient({ session }: { session: Session }) {
  const isGraphiste = session.role === 'graphiste'

  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    brand: '',
    filetype: '',
    status: '',
  })

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.brand) params.set('brand', filters.brand)
    if (filters.filetype) params.set('filetype', filters.filetype)
    if (filters.status) params.set('status', filters.status)

    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.assets ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} onUploaded={isGraphiste ? fetchAssets : undefined} />

      <main className="flex flex-1 flex-col gap-6 p-6">
        {/* Filtres */}
        <FilterBar filters={filters} onChange={setFilters} total={total} />

        {/* Grille */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-brand-teal border-t-transparent"
            />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-text-secondary">Aucun asset trouvé</p>
            {isGraphiste && (
              <p className="text-sm text-text-disabled">Utilise le bouton &quot;Importer&quot; dans la barre en haut pour commencer</p>
            )}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <AnimatePresence>
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={setSelectedAsset}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <AssetDetailModal
        asset={selectedAsset}
        isGraphiste={isGraphiste}
        onClose={() => setSelectedAsset(null)}
        onSaved={fetchAssets}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
