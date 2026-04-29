'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AssetWithDetails, Brand, AssetStatus } from '@/types'

const BRANDS: Brand[] = ['CASANOOV', 'CAZEBOO', 'SICAAN']
const STYLES = ['', 'filled', 'outlined', 'duotone', 'flat']

interface Props {
  asset: AssetWithDetails | null
  isGraphiste: boolean
  onClose: () => void
  onSaved: () => void
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

export default function AssetDetailModal({ asset, isGraphiste, onClose, onSaved, onStatusChange }: Props) {
  const [mode, setMode] = useState<'read' | 'edit'>('read')
  const [brand, setBrand] = useState<Brand | ''>('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [style, setStyle] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [updating, setUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const h = (id: string) => ({ onMouseEnter: () => setHovered(id), onMouseLeave: () => setHovered(null) })

  useEffect(() => {
    if (!asset) { setMode('read'); return }
    setBrand((asset.metadata?.brand as Brand) ?? '')
    setDescription(asset.metadata?.description ?? '')
    setColor(asset.metadata?.color ?? '')
    setStyle(asset.metadata?.style ?? '')
    setTags(asset.tags.map((t) => t.name).join(', '))
    setArchiveConfirm(false)
    setDeleteConfirm(false)
    setMode('read')
  }, [asset])

  async function handleSave() {
    if (!asset) return
    setSaving(true)
    await fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: brand || undefined,
        description: description || undefined,
        color: color || undefined,
        style: style || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    onSaved()
    setMode('read')
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
  const isArchived = asset?.status === 'archived'

  return (
    <AnimatePresence>
      {asset && (
        <>
          {/* Backdrop */}
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

          {/* Centrage */}
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
                maxWidth: '820px',
                maxHeight: '90vh',
                borderRadius: '16px',
                backgroundColor: '#f1f3f5',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              }}
            >
              {/* Colonne preview */}
              <div style={{
                width: '280px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                backgroundColor: '#fff',
                padding: '24px',
                borderRight: '1px solid #e5e7eb',
              }}>
                <div style={{
                  width: '220px', height: '220px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f3f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {canPreview ? (
                    <img
                      src={asset.filepath}
                      alt={asset.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase' }}>
                      {asset.filetype}
                    </span>
                  )}
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: 0, wordBreak: 'break-all' }}>
                    {asset.filename}
                  </p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {asset.filetype} · v{asset.version}
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  {...h('download')}
                  style={{
                    width: '100%', borderRadius: '8px',
                    backgroundColor: hovered === 'download' ? '#4a7a1e' : '#5d9228', border: 'none',
                    padding: '8px 12px', fontSize: '13px',
                    fontWeight: 600, color: '#fff', cursor: 'pointer',
                    fontFamily: 'inherit',
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
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: '#fff',
                  borderBottom: '1px solid #e5e7eb',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                      {mode === 'edit' ? 'Modifier' : 'Informations'}
                    </h2>
                    {isArchived && (
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        backgroundColor: '#fde8ea', color: '#d84150',
                        borderRadius: '99px', padding: '2px 8px',
                      }}>Archivé</span>
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
                          width: '30px', height: '30px',
                          borderRadius: '8px',
                          border: `1px solid ${hovered === 'pencil' ? '#5d9228' : '#e5e7eb'}`,
                          backgroundColor: hovered === 'pencil' ? '#e8f2dc' : '#fff',
                          cursor: 'pointer',
                          color: hovered === 'pencil' ? '#5d9228' : '#6b7280',
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
                        width: '30px', height: '30px',
                        borderRadius: '8px',
                        background: hovered === 'close' ? '#fde8ea' : 'none',
                        border: 'none', cursor: 'pointer',
                        fontSize: '16px',
                        color: hovered === 'close' ? '#d84150' : '#9ca3af',
                        lineHeight: 1,
                        transition: 'all 0.15s',
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
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                      >
                        {asset.metadata?.brand && <MetaRow label="Marque" value={asset.metadata.brand} />}
                        {asset.tags.length > 0 && <MetaRow label="Tags" value={asset.tags.map((t) => t.name).join(', ')} />}
                        {asset.metadata?.description && <MetaRow label="Description" value={asset.metadata.description} />}
                        {asset.metadata?.style && <MetaRow label="Style" value={asset.metadata.style} />}
                        {asset.metadata?.color && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Couleur</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: asset.metadata.color, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                              <span style={{ fontSize: '14px', color: '#1f2937' }}>{asset.metadata.color}</span>
                            </div>
                          </div>
                        )}
                        {asset.author && <MetaRow label="Auteur" value={asset.author} />}
                        <MetaRow label="Importé le" value={new Date(asset.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                      >
                        <Field label="Marque">
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {BRANDS.map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setBrand(brand === b ? '' : b)}
                                style={{
                                  flex: 1, padding: '7px 4px',
                                  borderRadius: '8px',
                                  border: `2px solid ${brand === b ? '#5d9228' : '#e5e7eb'}`,
                                  backgroundColor: brand === b ? '#e8f2dc' : '#fff',
                                  color: brand === b ? '#5d9228' : '#6b7280',
                                  fontSize: '11px', fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'inherit',
                                }}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <Field label="Tags (séparés par des virgules)">
                          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="home, navigation, interface…" style={inputStyle} />
                        </Field>

                        <Field label="Description">
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="À quoi sert cette icône…"
                            style={{ ...inputStyle, resize: 'none' }}
                          />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <Field label="Style">
                            <select value={style} onChange={(e) => setStyle(e.target.value)} style={inputStyle}>
                              {STYLES.map((s) => <option key={s} value={s}>{s || '— Aucun —'}</option>)}
                            </select>
                          </Field>
                          <Field label="Couleur">
                            <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#5d9228" style={inputStyle} />
                          </Field>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                {isGraphiste && (
                  <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
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
                            border: `1px solid ${hovered === 'update' ? '#5d9228' : '#e5e7eb'}`,
                            backgroundColor: hovered === 'update' ? '#e8f2dc' : 'transparent',
                            color: updating ? '#9ca3af' : hovered === 'update' ? '#5d9228' : '#6b7280',
                            cursor: updating ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                          }}
                        >
                          {updating ? 'Envoi…' : 'Mettre à jour'}
                        </button>
                        <button
                          onClick={handleArchive}
                          {...h('archive')}
                          style={{
                            fontSize: '12px', fontWeight: 500,
                            padding: '6px 12px', borderRadius: '8px',
                            border: `1px solid ${archiveConfirm ? '#d97706' : hovered === 'archive' ? '#d97706' : '#e5e7eb'}`,
                            backgroundColor: archiveConfirm ? '#fef3c7' : hovered === 'archive' ? '#fef3c7' : 'transparent',
                            color: archiveConfirm ? '#d97706' : hovered === 'archive' ? '#d97706' : '#9ca3af',
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s',
                          }}
                        >
                          {archiveConfirm ? 'Confirmer ?' : isArchived ? 'Désarchiver' : 'Archiver'}
                        </button>
                        <button
                          onClick={handleDelete}
                          {...h('delete')}
                          style={{
                            fontSize: '12px', fontWeight: 500,
                            padding: '6px 12px', borderRadius: '8px',
                            border: `1px solid ${deleteConfirm ? '#d84150' : hovered === 'delete' ? '#d84150' : '#e5e7eb'}`,
                            backgroundColor: deleteConfirm ? '#fde8ea' : hovered === 'delete' ? '#fde8ea' : 'transparent',
                            color: deleteConfirm ? '#d84150' : hovered === 'delete' ? '#d84150' : '#9ca3af',
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.15s',
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
                          backgroundColor: saving ? '#8ab54a' : hovered === 'save' ? '#4a7a1e' : '#5d9228',
                          padding: '9px 20px', fontSize: '14px',
                          fontWeight: 600, color: '#fff',
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
