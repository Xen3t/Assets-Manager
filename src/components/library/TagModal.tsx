'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MARQUES, MARQUE_LABELS, MARQUE_COLORS, COULEURS, TAXONOMY, getTypes, getGammes, formatLabel,
  type Marque, type Couleur,
} from '@/lib/taxonomy'
import { applyBrandTheme, restoreBaseBrand } from '@/lib/brand'

export interface TagFormData {
  name: string
  marque: Marque
  type: string
  selections: Record<string, string[]>
  couleur: Couleur | ''
  description: string
}

interface Props {
  file: File | null
  queue: number
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

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={labelStyle}>{label}{required && requiredDot}</label>
      {children}
      {error && <span style={{ fontSize: '12px', color: '#d84150' }}>{error}</span>}
    </div>
  )
}

export default function TagModal({ file, queue, onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [marque, setMarque] = useState<Marque | ''>('')
  const [activeType, setActiveType] = useState('')
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [couleur, setCouleur] = useState<Couleur | ''>('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!file) { restoreBaseBrand(); return }
    const dotIndex = file.name.lastIndexOf('.')
    setName(dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name)
    setMarque('')
    setActiveType('')
    setSelections({})
    setCouleur('')
    setDescription('')
    setErrors({})
  }, [file])

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

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Le nom est obligatoire'
    if (!marque) e.marque = 'La marque est obligatoire'
    if (!activeType && Object.keys(selections).length === 0) e.type = 'Sélectionner au moins un type'
    if (!description.trim()) e.description = 'La description est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleConfirm() {
    if (!validate()) return
    setSaving(true)
    const typeKeys = Object.keys(selections)
    const derivedType = typeKeys.length > 0 ? typeKeys.join(',') : activeType
    await onConfirm({
      name: name.trim(),
      marque: marque as Marque,
      type: derivedType,
      selections,
      couleur,
      description: description.trim(),
    })
    setSaving(false)
  }

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const canPreview = file && (file.name.endsWith('.svg') || file.name.endsWith('.png') || file.name.endsWith('.ico'))
  const types = marque ? getTypes(marque as Marque) : []
  const products = marque && activeType ? getGammes(marque as Marque, activeType) : []
  const bc = marque ? MARQUE_COLORS[marque as Marque] : { main: '#5d9228', light: '#e8f2dc' }

  function gammeCountForType(t: string): number {
    return (selections[t] ?? []).length
  }

  return (
    <AnimatePresence>
      {file && (
        <>
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

          <div style={{
            position: 'fixed', inset: 0, zIndex: 51,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: '580px',
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
                    flexShrink: 0, fontSize: '11px', fontWeight: 600,
                    backgroundColor: '#e8eaed', color: '#6b7280',
                    borderRadius: '99px', padding: '3px 10px',
                  }}>
                    +{queue} suivant{queue > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Formulaire */}
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Nom */}
                <Field label="Nom de l'icône" required error={errors.name}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: portail-eiger-battant"
                    style={{ ...inputStyle, borderColor: errors.name ? '#d84150' : '#e5e7eb' }}
                  />
                </Field>

                {/* Marque */}
                <Field label="Marque" required error={errors.marque}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {MARQUES.map((m) => {
                      const mc = MARQUE_COLORS[m]
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMarqueChange(m)}
                          style={{
                            flex: 1, padding: '8px',
                            borderRadius: '8px',
                            border: `2px solid ${marque === m ? mc.main : '#e5e7eb'}`,
                            backgroundColor: marque === m ? mc.light : '#fff',
                            color: marque === m ? mc.main : '#6b7280',
                            fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                            fontFamily: 'inherit',
                          }}
                        >
                          {MARQUE_LABELS[m]}
                        </button>
                      )
                    })}
                  </div>
                </Field>

                {/* Mini explorateur Type + Gamme */}
                {marque && (
                  <Field label="Type & Gamme(s)" required error={errors.type}>
                    <div style={{
                      display: 'flex',
                      border: `1px solid ${errors.type ? '#d84150' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      height: '200px',
                      backgroundColor: '#fff',
                    }}>
                      {/* Colonne Types */}
                      <div style={{
                        width: '46%',
                        borderRight: '1px solid #e5e7eb',
                        overflowY: 'auto',
                        flexShrink: 0,
                      }}>
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
                                width: '100%',
                                padding: '7px 10px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: isActive || hasSelection ? 600 : 400,
                                cursor: 'pointer',
                                backgroundColor: isActive ? bc.light : hasSelection ? bc.light + '99' : 'transparent',
                                color: isActive || hasSelection ? bc.main : '#374151',
                                border: 'none',
                                borderBottom: '1px solid #f3f4f6',
                                fontFamily: 'inherit',
                                transition: 'background-color 0.1s',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{t}</span>
                              {hasSelection && (
                                <span style={{
                                  flexShrink: 0, marginLeft: '4px',
                                  fontSize: '10px', fontWeight: 700,
                                  backgroundColor: bc.main, color: '#fff',
                                  borderRadius: '99px', padding: '1px 5px', lineHeight: 1.4,
                                }}>
                                  {count}
                                </span>
                              )}
                              {isActive && !hasSelection && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginLeft: '4px' }}>
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Colonne Gammes */}
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
                                  width: '100%', padding: '5px 10px',
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
                                      display: 'flex', alignItems: 'center', gap: '7px',
                                      padding: '6px 10px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      color: checked ? bc.main : '#374151',
                                      fontWeight: checked ? 600 : 400,
                                      borderBottom: '1px solid #f3f4f6',
                                      backgroundColor: checked ? bc.light + '99' : 'transparent',
                                      transition: 'background-color 0.1s',
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
                          <div style={{ padding: '12px 10px', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                            ← Sélectionner un type
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Résumé sélection */}
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

                {/* Couleur — optionnel */}
                <Field label="Couleur">
                  <select
                    value={couleur}
                    onChange={(e) => setCouleur(e.target.value as Couleur | '')}
                    style={inputStyle}
                  >
                    <option value="">— Aucune —</option>
                    {COULEURS.map((c) => (
                      <option key={c} value={c}>{formatLabel(c)}</option>
                    ))}
                  </select>
                </Field>

                {/* Description */}
                <Field label="Description" required error={errors.description}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="À quoi sert cet asset…"
                    style={{ ...inputStyle, resize: 'none', borderColor: errors.description ? '#d84150' : '#e5e7eb' }}
                  />
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
                    backgroundColor: 'var(--brand-main)',
                    opacity: saving ? 0.65 : 1,
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
