'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AssetWithDetails } from '@/types'

interface Props {
  asset: AssetWithDetails
  onClick: (asset: AssetWithDetails) => void
  selected?: boolean
  onSelect?: (id: number, selected: boolean) => void
}

function AssetPreview({ asset }: { asset: AssetWithDetails }) {
  const canPreview = asset.filetype === 'svg' || asset.filetype === 'png' || asset.filetype === 'ico'
  if (canPreview) {
    return (
      <img
        src={asset.filepath}
        alt={asset.filename}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px', boxSizing: 'border-box' }}
        loading="lazy"
      />
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>EPS</span>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

export default function AssetCard({ asset, onClick, selected = false, onSelect }: Props) {
  const [hovered, setHovered] = useState(false)

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = asset.filepath
    a.download = asset.filename
    a.click()
  }

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation()
    onSelect?.(asset.id, !selected)
  }

  const showCheckbox = hovered || selected

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: isArchived(asset) ? 0.45 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(asset)}
      style={{
        position: 'relative',
        aspectRatio: '1',
        borderRadius: '12px',
        backgroundColor: '#fff',
        border: selected ? '2px solid var(--brand-main)' : '1px solid #e5e7eb',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 3px rgba(93,146,40,0.15)'
          : hovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <AssetPreview asset={asset} />

      {/* Checkbox sélection */}
      <AnimatePresence>
        {showCheckbox && onSelect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            onClick={handleCheckbox}
            style={{
              position: 'absolute', top: '8px', left: '8px',
              width: '20px', height: '20px',
              borderRadius: '6px',
              border: `2px solid ${selected ? 'var(--brand-main)' : '#d1d5db'}`,
              backgroundColor: selected ? 'var(--brand-main)' : 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              transition: 'all 0.12s',
              zIndex: 2,
            }}
          >
            {selected && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
              padding: '8px',
            }}
          >
            <button
              onClick={handleDownload}
              title="Télécharger"
              style={{
                width: '32px', height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#1f2937',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            >
              <DownloadIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function isArchived(asset: AssetWithDetails) {
  return asset.status === 'archived'
}
