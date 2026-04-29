'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/shared/Header'
import FilterBar, { type Filters } from '@/components/library/FilterBar'
import AssetCard from '@/components/library/AssetCard'
import AssetDetailModal from '@/components/library/AssetDetailModal'
import SearchSpotlight from '@/components/library/SearchSpotlight'
import type { AssetWithDetails, Session, AssetStatus } from '@/types'

export default function LibraryClient({ session }: { session: Session | null }) {
  const isPrivileged = session?.role === 'graphiste' || session?.role === 'admin'

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} onUploaded={isPrivileged ? fetchAssets : undefined} />

      <main className="flex flex-1 flex-col bg-background">
        {/* Zone recherche + filtres */}
        <div style={{
          backgroundColor: '#f1f3f5',
          borderBottom: '1px solid #e5e7eb',
          padding: '28px 24px 24px',
        }}>
          <FilterBar filters={filters} onChange={setFilters} total={total} />
        </div>

        {/* Résultats */}
        <div style={{ flex: 1, padding: '24px' }}>
          {loading ? (
            <div className="flex flex-1 items-center justify-center" style={{ minHeight: '300px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 rounded-full border-2 border-brand-teal border-t-transparent"
              />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center" style={{ minHeight: '300px' }}>
              <p className="text-text-secondary">Aucun asset trouvé</p>
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
        </div>
      </main>

      <SearchSpotlight onSelect={setSelectedAsset} />

      <AssetDetailModal
        asset={selectedAsset}
        isGraphiste={isPrivileged}
        onClose={() => setSelectedAsset(null)}
        onSaved={fetchAssets}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
