'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TagModal, { type TagFormData } from './TagModal'

interface Props {
  onUploaded: () => void
}

export default function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [queue, setQueue] = useState<File[]>([])
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setQueue(list)
    // Reset l'input pour permettre de re-sélectionner les mêmes fichiers
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleConfirm(data: TagFormData) {
    const file = queue[0]
    if (!file) return

    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', data.name)
    fd.append('brand', data.brand)
    fd.append('tags', JSON.stringify(data.tags))
    if (data.description) fd.append('description', data.description)
    if (data.color) fd.append('color', data.color)
    if (data.style) fd.append('style', data.style)

    const res = await fetch('/api/assets', { method: 'POST', body: fd })
    const result = await res.json()

    // Passe au fichier suivant
    setQueue((prev) => prev.slice(1))

    if (!res.ok) {
      setMessage({ text: result.error ?? 'Erreur lors de l\'import', type: 'error' })
      setTimeout(() => setMessage(null), 4000)
      return
    }

    if (result.duplicate) {
      setMessage({ text: `"${data.name}" existe déjà dans la bibliothèque`, type: 'info' })
    } else {
      setMessage({ text: `"${data.name}" importé avec succès`, type: 'success' })
      onUploaded()
    }
    setTimeout(() => setMessage(null), 4000)
  }

  function handleCancel() {
    // Annule tous les fichiers restants
    setQueue([])
  }

  const colors = {
    success: { bg: '#e8f2dc', color: '#5d9228' },
    error: { bg: '#fde8ea', color: '#d84150' },
    info: { bg: '#e0f4f6', color: '#38a0ad' },
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".svg,.png,.ico,.eps"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <button
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            borderRadius: '8px', border: 'none',
            backgroundColor: '#5d9228',
            padding: '9px 16px',
            fontSize: '14px', fontWeight: 600, color: '#fff',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background-color 0.2s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Importer des assets
        </button>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{
                margin: 0, borderRadius: '8px',
                padding: '8px 12px', fontSize: '13px', fontWeight: 500,
                backgroundColor: colors[message.type].bg,
                color: colors[message.type].color,
              }}
            >
              {message.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de tagging — s'ouvre pour chaque fichier */}
      <TagModal
        file={queue[0] ?? null}
        queue={queue.length - 1}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
