'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/shared/Header'
import FilterBar, { type Filters } from '@/components/library/FilterBar'
import AssetCard from '@/components/library/AssetCard'
import AssetDetailModal from '@/components/library/AssetDetailModal'
import SearchSpotlight from '@/components/library/SearchSpotlight'
import type { AssetWithDetails, Session, AssetStatus } from '@/types'

function ZipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

export default function LibraryClient({ session }: { session: Session | null }) {
  const isPrivileged = session?.role === 'graphiste' || session?.role === 'admin'

  const [assets, setAssets] = useState<AssetWithDetails[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetWithDetails | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [downloading, setDownloading] = useState(false)
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

  // Deselect assets that are no longer visible after filter change
  useEffect(() => {
    if (selectedIds.size === 0) return
    const visibleIds = new Set(assets.map((a) => a.id))
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [assets, selectedIds.size])

  function handleSelect(id: number, sel: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (sel) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleSelectAll() {
    setSelectedIds(new Set(assets.map((a) => a.id)))
  }

  function handleClearSelection() {
    setSelectedIds(new Set())
  }

  async function handleDownloadZip() {
    if (selectedIds.size === 0 || downloading) return
    setDownloading(true)
    const res = await fetch('/api/assets/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selectedIds] }),
    })
    setDownloading(false)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assets-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

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

  const selCount = selectedIds.size

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />

      <main className="flex flex-1 flex-col bg-background">
        {/* Zone recherche + filtres */}
        <div style={{
          backgroundColor: '#f1f3f5',
          borderBottom: '1px solid #e5e7eb',
          padding: '28px 24px 24px',
        }}>
          <FilterBar filters={filters} onChange={setFilters} total={total} onUploaded={isPrivileged ? fetchAssets : undefined} />
        </div>

        {/* Résultats */}
        <div style={{ flex: 1, padding: '24px', paddingBottom: selCount > 0 ? '96px' : '24px', transition: 'padding-bottom 0.2s' }}>
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
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={setSelectedAsset}
                    selected={selectedIds.has(asset.id)}
                    onSelect={handleSelect}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <SearchSpotlight onSelect={setSelectedAsset} />

      {/* Barre de sélection flottante */}
      <AnimatePresence>
        {selCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#1f2937',
              borderRadius: '14px',
              padding: '10px 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Count badge */}
            <span style={{
              fontSize: '13px', fontWeight: 600, color: '#fff',
              backgroundColor: '#5d9228',
              borderRadius: '8px',
              padding: '3px 10px',
              minWidth: '28px',
              textAlign: 'center',
            }}>
              {selCount}
            </span>
            <span style={{ fontSize: '13px', color: '#d1d5db', marginRight: '4px' }}>
              asset{selCount > 1 ? 's' : ''} sélectionné{selCount > 1 ? 's' : ''}
            </span>

            {/* Tout sélectionner */}
            {selCount < assets.length && (
              <button
                onClick={handleSelectAll}
                style={{
                  fontSize: '12px', fontWeight: 500,
                  color: '#9ca3af',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  padding: '4px 8px', borderRadius: '6px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                Tout sélectionner
              </button>
            )}

            {/* Séparateur */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#374151' }} />

            {/* Désélectionner */}
            <button
              onClick={handleClearSelection}
              style={{
                fontSize: '12px', fontWeight: 500,
                color: '#9ca3af',
                background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                padding: '4px 8px', borderRadius: '6px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            >
              Désélectionner
            </button>

            {/* Séparateur */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#374151' }} />

            {/* Télécharger ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600,
                color: downloading ? '#8ab54a' : '#fff',
                backgroundColor: downloading ? 'transparent' : '#5d9228',
                border: 'none',
                cursor: downloading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                padding: '7px 14px', borderRadius: '8px',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.backgroundColor = '#4a7a1e' }}
              onMouseLeave={(e) => { if (!downloading) e.currentTarget.style.backgroundColor = '#5d9228' }}
            >
              <ZipIcon />
              {downloading ? 'Préparation…' : 'Télécharger en ZIP'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
