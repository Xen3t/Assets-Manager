'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Brand } from '@/types'

const BRANDS: Brand[] = ['CASANOOV', 'CAZEBOO', 'SICAAN']
const STYLES = ['', 'filled', 'outlined', 'duotone', 'flat']

export interface TagFormData {
  name: string
  brand: Brand
  tags: string[]
  description: string
  color: string
  style: string
}

interface Props {
  file: File | null
  queue: number      // fichiers restants après celui-ci
  onConfirm: (data: TagFormData) => Promise<void>
  onCancel: () => void
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

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const requiredDot = <span style={{ color: '#d84150', marginLeft: '2px' }}>*</span>

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>{label}{required && requiredDot}</label>
      {children}
    </div>
  )
}

export default function TagModal({ file, queue, onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState<Brand | ''>('')
  const [tagsInput, setTagsInput] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [style, setStyle] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!file) return
    // Pré-remplir le nom sans extension
    const dotIndex = file.name.lastIndexOf('.')
    setName(dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name)
    setBrand('')
    setTagsInput('')
    setDescription('')
    setColor('')
    setStyle('')
    setErrors({})
  }, [file])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Le nom est obligatoire'
    if (!brand) e.brand = 'La marque est obligatoire'
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length === 0) e.tags = 'Au moins un tag est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleConfirm() {
    if (!validate()) return
    setSaving(true)
    await onConfirm({
      name: name.trim(),
      brand: brand as Brand,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      description,
      color,
      style,
    })
    setSaving(false)
  }

  // Preview de l'icône
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const canPreview = file && (file.name.endsWith('.svg') || file.name.endsWith('.png') || file.name.endsWith('.ico'))

  return (
    <AnimatePresence>
      {file && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 51,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: '560px',
                borderRadius: '16px',
                backgroundColor: '#f1f3f5',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                overflow: 'hidden',
              }}
            >
              {/* En-tête */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '20px 24px',
                backgroundColor: '#fff',
                borderBottom: '1px solid #e5e7eb',
              }}>
                {/* Preview */}
                <div style={{
                  width: '56px', height: '56px', flexShrink: 0,
                  borderRadius: '10px', backgroundColor: '#f1f3f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {canPreview && previewUrl ? (
                    <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                  ) : (
                    <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>
                      {file.name.split('.').pop()}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                    Tagger avant d&apos;importer
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                </div>

                {queue > 0 && (
                  <span style={{
                    flexShrink: 0,
                    fontSize: '11px', fontWeight: 600,
                    backgroundColor: '#e8eaed', color: '#6b7280',
                    borderRadius: '99px', padding: '3px 10px',
                  }}>
                    +{queue} suivant{queue > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Formulaire */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Nom */}
                <Field label="Nom de l'icône" required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: icon-home"
                    style={{ ...inputStyle, borderColor: errors.name ? '#d84150' : '#e5e7eb' }}
                  />
                  {errors.name && <span style={{ fontSize: '12px', color: '#d84150' }}>{errors.name}</span>}
                </Field>

                {/* Brand */}
                <Field label="Marque" required>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {BRANDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrand(b)}
                        style={{
                          flex: 1, padding: '8px',
                          borderRadius: '8px',
                          border: `2px solid ${brand === b ? '#5d9228' : '#e5e7eb'}`,
                          backgroundColor: brand === b ? '#e8f2dc' : '#fff',
                          color: brand === b ? '#5d9228' : '#6b7280',
                          fontSize: '12px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  {errors.brand && <span style={{ fontSize: '12px', color: '#d84150' }}>{errors.brand}</span>}
                </Field>

                {/* Tags */}
                <Field label="Tags" required>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="home, navigation, menu, interface…"
                    style={{ ...inputStyle, borderColor: errors.tags ? '#d84150' : '#e5e7eb' }}
                  />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Sépare les tags par des virgules</span>
                  {errors.tags && <span style={{ fontSize: '12px', color: '#d84150' }}>{errors.tags}</span>}
                </Field>

                {/* Optionnels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Style">
                    <select value={style} onChange={(e) => setStyle(e.target.value)} style={inputStyle}>
                      {STYLES.map((s) => <option key={s} value={s}>{s || '— Aucun —'}</option>)}
                    </select>
                  </Field>
                  <Field label="Couleur principale">
                    <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#5d9228" style={inputStyle} />
                  </Field>
                </div>

                <Field label="Description">
                  <input value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="À quoi sert cette icône…" style={inputStyle} />
                </Field>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#fff',
              }}>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  style={{
                    borderRadius: '8px', border: '1px solid #e5e7eb',
                    backgroundColor: '#fff', padding: '9px 18px',
                    fontSize: '14px', color: '#6b7280',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  style={{
                    borderRadius: '8px', border: 'none',
                    backgroundColor: saving ? '#8ab54a' : '#5d9228',
                    padding: '9px 20px',
                    fontSize: '14px', fontWeight: 600, color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {saving ? 'Import…' : queue > 0 ? 'Importer et suivant →' : 'Importer'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
