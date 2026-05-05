'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AssetWithDetails, AssetStatus } from '@/types'
import {
  MARQUES, MARQUE_LABELS, MARQUE_COLORS, COULEURS, getTypes, getGammes, formatLabel,
  type Marque, type Couleur,
} from '@/lib/taxonomy'
import { applyBrandTheme, restoreBaseBrand } from '@/lib/brand'

interface Props {
  asset: AssetWithDetails | null
  isGraphiste: boolean
  onClose: () => void
  onSaved: (updated?: AssetWithDetails) => void
  onStatusChange: (id: number, status: AssetStatus | 'active') => Promise<void>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff',
  padding: '8px 12px',
  fontSize: '14px',
  color: '#1f2937',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#1f2937' }}>{value}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function formatAuteurDate(author?: string, createdAt?: string): string {
  const parts: string[] = []
  if (author) parts.push(author)
  if (createdAt) {
    const d = new Date(createdAt)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    parts.push(`${day}-${month}-${year}`)
  }
  return parts.join(' · ')
}

export default function AssetDetailModal({ asset, isGraphiste, onClose, onSaved, onStatusChange }: Props) {
  const [mode, setMode] = useState<'read' | 'edit'>('read')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [marque, setMarque] = useState<Marque | ''>('')
  const [activeType, setActiveType] = useState('')
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [couleur, setCouleur] = useState<Couleur | ''>('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const h = (id: string) => ({ onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) })

  useEffect(() => {
    if (!asset) { setMode('read'); setRenaming(false); restoreBaseBrand(); return }
    setRenaming(false)
    const assetMarque = (asset.metadata?.marque as Marque) ?? ''
    setMarque(assetMarque)
    if (assetMarque) applyBrandTheme(assetMarque)
    const parsedSelections = parseSelections(asset.metadata?.gamme ?? null, asset.metadata?.type ?? null)
    setSelections(parsedSelections)
    const firstType = Object.keys(parsedSelections)[0] ?? asset.metadata?.type?.split(',')[0] ?? ''
    setActiveType(firstType)
    setCouleur((asset.metadata?.couleur as Couleur) ?? '')
    setDescription(asset.metadata?.description ?? '')
    setArchiveConfirm(false)
    setDeleteConfirm(false)
    setMode('read')
  }, [asset])

  function parseSelections(gammeRaw: string | null, typeRaw: string | null): Record<string, string[]> {
    if (!gammeRaw) return {}
    if (gammeRaw.startsWith('{')) {
      try { return JSON.parse(gammeRaw) as Record<string, string[]> } catch { return {} }
    }
    // Legacy flat CSV — reconstruct using the stored type if it's unambiguous
    if (typeRaw) {
      const types = typeRaw.split(',').filter(Boolean)
      if (types.length === 1) return { [types[0]]: gammeRaw.split(',').filter(Boolean) }
    }
    return {}
  }

  function handleMarqueChange(m: Marque) {
    setMarque(m)
    setActiveType('')
    setSelections({})
    applyBrandTheme(m)
  }

  function toggleGamme(g: string, t: string) {
    setSelections((prev) => {
      const curr = prev[t] ?? []
      const next = curr.includes(g) ? curr.filter((x) => x !== g) : [...curr, g]
      if (next.length === 0) {
        const { [t]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [t]: next }
    })
  }

  function gammeCountForType(t: string): number {
    return (selections[t] ?? []).length
  }

  async function handleSave() {
    if (!asset) return
    setSaving(true)
    const typeKeys = Object.keys(selections)
    const derivedType = typeKeys.length > 0 ? typeKeys.join(',') : activeType || undefined
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marque: marque || undefined,
        type: derivedType,
        gamme: typeKeys.length > 0 ? JSON.stringify(selections) : undefined,
        couleur: couleur || undefined,
        description: description || undefined,
      }),
    })
    const updated = res.ok ? await res.json() as AssetWithDetails : undefined
    setSaving(false)
    onSaved(updated)
    setMode('read')
  }

  function startRename() {
    if (!asset) return
    setRenameValue(asset.filename)
    setRenaming(true)
    setTimeout(() => renameInputRef.current?.select(), 30)
  }

  async function confirmRename() {
    if (!asset || !renameValue.trim() || renameValue.trim() === asset.filename) {
      setRenaming(false)
      return
    }
    setRenameSaving(true)
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: renameValue.trim() }),
    })
    const updated = res.ok ? await res.json() as AssetWithDetails : undefined
    setRenameSaving(false)
    setRenaming(false)
    if (updated) onSaved(updated)
  }

  function handleDownload() {
    if (!asset) return
    const a = document.createElement('a')
    a.href = asset.filepath
    a.download = asset.filename
    a.click()
  }

  async function handleUpdateFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !asset) return
    setUpdating(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/assets/${asset.id}/version`, { method: 'POST', body: fd })
    setUpdating(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (res.ok) { onSaved(); onClose() }
  }

  async function handleArchive() {
    if (!asset) return
    if (!archiveConfirm) { setArchiveConfirm(true); setDeleteConfirm(false); return }
    await onStatusChange(asset.id, asset.status === 'archived' ? 'active' : 'archived')
    onClose()
  }

  async function handleDelete() {
    if (!asset) return
    if (!deleteConfirm) { setDeleteConfirm(true); setArchiveConfirm(false); return }
    await onStatusChange(asset.id, 'deleted')
    onClose()
  }

  const canPreview = asset && (asset.filetype === 'svg' || asset.filetype === 'png' || asset.filetype === 'ico')
  const bc = marque ? MARQUE_COLORS[marque as Marque] : { main: 'var(--brand-main)', light: 'var(--brand-light)', dark: 'var(--brand-dark)' }
  const isArchived = asset?.status === 'archived'
  const types = marque ? getTypes(marque as Marque) : []
  const products = marque && activeType ? getGammes(marque as Marque, activeType) : []

  return (
    <AnimatePresence>
      {asset && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
            }}
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                width: '100%',
                maxWidth: '860px',
                maxHeight: '90vh',
                borderRadius: '16px',
                backgroundColor: '#f1f3f5',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              }}
            >
              {/* Colonne preview */}
              <div style={{
                width: '280px', flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '16px',
                backgroundColor: '#fff',
                padding: '24px',
                borderRight: '1px solid #e5e7eb',
              }}>
                <div style={{
                  width: '220px', height: '220px', borderRadius: '12px',
                  backgroundColor: '#f1f3f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {canPreview ? (
                    <img src={asset.filepath} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                  ) : (
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase' }}>
                      {asset.filetype}
                    </span>
                  )}
                </div>

                <div style={{ width: '100%' }}>
                  {renaming ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenaming(false) }}
                        disabled={renameSaving}
                        style={{
                          width: '100%', borderRadius: '6px',
                          border: '1.5px solid #d97706',
                          padding: '5px 8px', fontSize: '12px',
                          color: '#1f2937', outline: 'none',
                          boxSizing: 'border-box', fontFamily: 'inherit',
                          backgroundColor: '#fff',
                        }}
                      />
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '5px',
                        padding: '6px 8px', borderRadius: '6px',
                        backgroundColor: '#fef3c7', border: '1px solid #fde68a',
                      }}>
                        <span style={{ fontSize: '12px', flexShrink: 0 }}>⚠️</span>
                        <span style={{ fontSize: '11px', color: '#92400e', lineHeight: 1.4 }}>
                          Peut casser des automatisations qui s&apos;appuient sur ce nom.
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={confirmRename}
                          disabled={renameSaving}
                          style={{
                            flex: 1, padding: '5px', borderRadius: '6px',
                            backgroundColor: 'var(--brand-main)', border: 'none',
                            color: '#fff', fontSize: '11px', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          {renameSaving ? '…' : 'OK'}
                        </button>
                        <button
                          onClick={() => setRenaming(false)}
                          disabled={renameSaving}
                          style={{
                            flex: 1, padding: '5px', borderRadius: '6px',
                            backgroundColor: '#fff', border: '1px solid #e5e7eb',
                            color: '#6b7280', fontSize: '11px',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p
                        onClick={isGraphiste ? startRename : undefined}
                        title={isGraphiste ? 'Cliquer pour renommer' : undefined}
                        style={{
                          fontSize: '13px', fontWeight: 600, color: '#1f2937',
                          margin: 0, wordBreak: 'break-all',
                          cursor: isGraphiste ? 'text' : 'default',
                          borderRadius: '4px', padding: '2px 4px',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { if (isGraphiste) e.currentTarget.style.backgroundColor = '#f1f3f5' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        {asset.filename}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {asset.filetype} · v{asset.version}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDownload}
                  {...h('download')}
                  style={{
                    width: '100%', borderRadius: '8px',
                    backgroundColor: hovered === 'download' ? 'var(--brand-dark)' : 'var(--brand-main)', border: 'none',
                    padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#fff',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transform: hovered === 'download' ? 'translateY(-1px)' : 'none',
                    boxShadow: hovered === 'download' ? '0 4px 12px rgba(93,146,40,0.35)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <DownloadIcon />
                  Télécharger
                </button>
              </div>

              {/* Colonne métadonnées */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', backgroundColor: '#fff',
                  borderBottom: '1px solid #e5e7eb', gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {mode === 'edit' ? 'Modifier' : 'Informations'}
                    </h2>
                    {isArchived && (
                      <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#fde8ea', color: '#d84150', borderRadius: '99px', padding: '2px 8px' }}>
                        Archivé
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isGraphiste && mode === 'read' && (
                      <button
                        onClick={() => setMode('edit')}
                        title="Modifier"
                        {...h('pencil')}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '30px', height: '30px', borderRadius: '8px',
                          border: `1px solid ${hovered === 'pencil' ? 'var(--brand-main)' : '#e5e7eb'}`,
                          backgroundColor: hovered === 'pencil' ? 'var(--brand-light)' : '#fff',
                          cursor: 'pointer',
                          color: hovered === 'pencil' ? 'var(--brand-main)' : '#6b7280',
                          transition: 'all 0.15s',
                        }}
                      >
                        <PencilIcon />
                      </button>
                    )}
                    {mode === 'edit' && (
                      <button
                        onClick={() => setMode('read')}
                        {...h('cancel')}
                        style={{
                          fontSize: '13px',
                          color: hovered === 'cancel' ? '#1f2937' : '#6b7280',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', padding: '4px 8px',
                          transition: 'color 0.15s',
                        }}
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      {...h('close')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: hovered === 'close' ? '#fde8ea' : 'none',
                        border: 'none', cursor: 'pointer', fontSize: '16px',
                        color: hovered === 'close' ? '#d84150' : '#9ca3af',
                        lineHeight: 1, transition: 'all 0.15s',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Corps */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                  <AnimatePresence mode="wait">
                    {mode === 'read' ? (
                      <motion.div
                        key="read"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                      >
                        {asset.metadata?.marque && (
                          <MetaRow label="Marque" value={MARQUE_LABELS[asset.metadata.marque as Marque] ?? asset.metadata.marque.toUpperCase()} />
                        )}
                        {(asset.metadata?.gamme || asset.metadata?.type) && (() => {
                          const raw = asset.metadata?.gamme ?? ''
                          if (raw.startsWith('{')) {
                            try {
                              const sel = JSON.parse(raw) as Record<string, string[]>
                              const text = Object.entries(sel)
                                .map(([t, gs]) => `${t} (${gs.join(', ')})`)
                                .join(' · ')
                              return <MetaRow label="Gamme(s)" value={text} />
                            } catch { /* fall through */ }
                          }
                          if (raw) return <MetaRow label="Gamme(s)" value={raw.split(',').filter(Boolean).join(', ')} />
                          return <MetaRow label="Type(s)" value={asset.metadata!.type!.split(',').filter(Boolean).join(', ')} />
                        })()}
                        {asset.metadata?.couleur && <MetaRow label="Couleur" value={formatLabel(asset.metadata.couleur)} />}
                        {asset.metadata?.description && <MetaRow label="Description" value={asset.metadata.description} />}
                        <MetaRow label="Auteur · Import" value={formatAuteurDate(asset.author, asset.createdAt)} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                      >
                        {/* Marque */}
                        <Field label="Marque">
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {MARQUES.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => handleMarqueChange(m)}
                                style={{
                                  flex: 1, padding: '7px 4px', borderRadius: '8px',
                                  border: `2px solid ${marque === m ? MARQUE_COLORS[m].main : '#e5e7eb'}`,
                                  backgroundColor: marque === m ? MARQUE_COLORS[m].light : '#fff',
                                  color: marque === m ? MARQUE_COLORS[m].main : '#6b7280',
                                  fontSize: '11px', fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                }}
                              >
                                {MARQUE_LABELS[m]}
                              </button>
                            ))}
                          </div>
                        </Field>

                        {/* Mini explorateur */}
                        {marque && (
                          <Field label="Type & Gamme(s)">
                            <div style={{
                              display: 'flex',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              height: '180px',
                              backgroundColor: '#fff',
                            }}>
                              <div style={{ width: '46%', borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }}>
                                {types.map((t) => {
                                  const count = gammeCountForType(t)
                                  const isActive = activeType === t
                                  const hasSelection = count > 0
                                  return (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => setActiveType(t)}
                                      style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        width: '100%', padding: '6px 8px', textAlign: 'left',
                                        fontSize: '11px', fontWeight: isActive || hasSelection ? 600 : 400,
                                        cursor: 'pointer',
                                        backgroundColor: isActive ? bc.light : hasSelection ? bc.light + '99' : 'transparent',
                                        color: isActive || hasSelection ? bc.main : '#374151',
                                        border: 'none', borderBottom: '1px solid #f3f4f6',
                                        fontFamily: 'inherit', transition: 'background-color 0.1s',
                                      }}
                                    >
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{t}</span>
                                      {hasSelection && (
                                        <span style={{
                                          flexShrink: 0, marginLeft: '3px',
                                          fontSize: '9px', fontWeight: 700,
                                          backgroundColor: bc.main, color: '#fff',
                                          borderRadius: '99px', padding: '1px 4px', lineHeight: 1.4,
                                        }}>
                                          {count}
                                        </span>
                                      )}
                                      {isActive && !hasSelection && (
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginLeft: '3px' }}>
                                          <polyline points="9 18 15 12 9 6"/>
                                        </svg>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>

                              <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
                                {activeType ? (() => {
                                  const allChecked = products.length > 0 && products.every((g) => (selections[activeType] ?? []).includes(g))
                                  return (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (allChecked) {
                                            const { [activeType]: _, ...rest } = selections
                                            setSelections(rest)
                                          } else {
                                            setSelections((prev) => ({ ...prev, [activeType]: products }))
                                          }
                                        }}
                                        style={{
                                          width: '100%', padding: '5px 8px',
                                          fontSize: '10px', fontWeight: 600,
                                          color: allChecked ? '#d84150' : bc.main,
                                          backgroundColor: allChecked ? '#fde8ea' : bc.light,
                                          border: 'none', borderBottom: '1px solid #e5e7eb',
                                          cursor: 'pointer', textAlign: 'left',
                                          fontFamily: 'inherit', flexShrink: 0,
                                        }}
                                      >
                                        {allChecked ? 'Tout déselectionner' : 'Tout sélectionner'}
                                      </button>
                                      {products.map((g) => {
                                        const checked = (selections[activeType] ?? []).includes(g)
                                        return (
                                          <label
                                            key={g}
                                            style={{
                                              display: 'flex', alignItems: 'center', gap: '6px',
                                              padding: '5px 8px', cursor: 'pointer',
                                              fontSize: '11px',
                                              color: checked ? bc.main : '#374151',
                                              fontWeight: checked ? 600 : 400,
                                              borderBottom: '1px solid #f3f4f6',
                                              backgroundColor: checked ? bc.light + '99' : 'transparent',
                                            }}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={() => toggleGamme(g, activeType)}
                                              style={{ accentColor: bc.main, cursor: 'pointer', flexShrink: 0 }}
                                            />
                                            {g}
                                          </label>
                                        )
                                      })}
                                    </>
                                  )
                                })() : (
                                  <div style={{ padding: '10px 8px', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                                    ← Sélectionner un type
                                  </div>
                                )}
                              </div>
                            </div>

                            {Object.keys(selections).length > 0 && (
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {Object.entries(selections).map(([t, gs], i) => (
                                  <span key={t}>
                                    {i > 0 && ' · '}
                                    <span style={{ fontWeight: 600 }}>{t}</span>
                                    {' '}({gs.join(', ')})
                                  </span>
                                ))}
                              </div>
                            )}
                          </Field>
                        )}

                        {/* Couleur */}
                        <Field label="Couleur">
                          <select value={couleur} onChange={(e) => setCouleur(e.target.value as Couleur | '')} style={inputStyle}>
                            <option value="">— Aucune —</option>
                            {COULEURS.map((c) => (
                              <option key={c} value={c}>{formatLabel(c)}</option>
                            ))}
                          </select>
                        </Field>

                        {/* Description */}
                        <Field label="Description">
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="À quoi sert cet asset…"
                            style={{ ...inputStyle, resize: 'none' }}
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                {isGraphiste && (
                  <div style={{
                    padding: '12px 20px', borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    display: 'flex', alignItems: 'center',
                    justifyContent: mode === 'edit' ? 'flex-end' : 'space-between',
                    gap: '8px',
                  }}>
                    {mode === 'read' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".svg,.png,.ico,.eps"
                          style={{ display: 'none' }}
                          onChange={handleUpdateFile}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={updating}
                          {...(updating ? {} : h('update'))}
                          style={{
                            fontSize: '12px', fontWeight: 500,
                            padding: '6px 12px', borderRadius: '8px',
                            border: `1px solid ${hovered === 'update' ? 'var(--brand-main)' : '#e5e7eb'}`,
                            backgroundColor: hovered === 'update' ? 'var(--brand-light)' : 'transparent',
                            color: updating ? '#9ca3af' : hovered === 'update' ? 'var(--brand-main)' : '#6b7280',
                            cursor: updating ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.15s',
                          }}
                        >
                          {updating ? 'Envoi…' : 'Mettre à jour'}
                        </button>
                        <button
                          onClick={handleArchive}
                          {...h('archive')}
                          style={{
                            fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '8px',
                            border: `1px solid ${archiveConfirm ? '#d97706' : hovered === 'archive' ? '#d97706' : '#e5e7eb'}`,
                            backgroundColor: archiveConfirm ? '#fef3c7' : hovered === 'archive' ? '#fef3c7' : 'transparent',
                            color: archiveConfirm ? '#d97706' : hovered === 'archive' ? '#d97706' : '#9ca3af',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                          }}
                        >
                          {archiveConfirm ? 'Confirmer ?' : isArchived ? 'Désarchiver' : 'Archiver'}
                        </button>
                        <button
                          onClick={handleDelete}
                          {...h('delete')}
                          style={{
                            fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '8px',
                            border: `1px solid ${deleteConfirm ? '#d84150' : hovered === 'delete' ? '#d84150' : '#e5e7eb'}`,
                            backgroundColor: deleteConfirm ? '#fde8ea' : hovered === 'delete' ? '#fde8ea' : 'transparent',
                            color: deleteConfirm ? '#d84150' : hovered === 'delete' ? '#d84150' : '#9ca3af',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                          }}
                        >
                          {deleteConfirm ? 'Confirmer ?' : 'Supprimer'}
                        </button>
                      </div>
                    )}

                    {mode === 'edit' && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        {...(saving ? {} : h('save'))}
                        style={{
                          borderRadius: '8px', border: 'none',
                          backgroundColor: hovered === 'save' ? 'var(--brand-dark)' : 'var(--brand-main)',
                          opacity: saving ? 0.65 : 1,
                          padding: '9px 20px', fontSize: '14px', fontWeight: 600, color: '#fff',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          transform: hovered === 'save' ? 'translateY(-1px)' : 'none',
                          boxShadow: hovered === 'save' ? '0 4px 12px rgba(93,146,40,0.35)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
