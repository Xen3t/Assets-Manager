'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AssetWithDetails } from '@/types'

interface Props {
  onSelect: (asset: AssetWithDetails) => void
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SearchSpotlight({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AssetWithDetails[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 150)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    const res = await fetch(`/api/assets?search=${encodeURIComponent(q)}&status=active`)
    const data = await res.json()
    setResults((data.assets ?? []).slice(0, 8))
    setActiveIndex(0)
  }, [])

  useEffect(() => { fetchResults(debouncedQuery) }, [debouncedQuery, fetchResults])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIndex]) { handleSelect(results[activeIndex]) }
  }

  function handleSelect(asset: AssetWithDetails) {
    setOpen(false)
    onSelect(asset)
  }

  const canPreview = (a: AssetWithDetails) => a.filetype === 'svg' || a.filetype === 'png' || a.filetype === 'ico'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 61, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20vh' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%', maxWidth: '560px', borderRadius: '16px', backgroundColor: '#f1f3f5', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}
            >
              {/* Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: '#fff', borderBottom: results.length > 0 ? '1px solid #e5e7eb' : 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher un asset…"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#1f2937', backgroundColor: 'transparent', fontFamily: 'inherit' }}
                />
                <kbd style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#f1f3f5', borderRadius: '4px', padding: '2px 6px', flexShrink: 0 }}>Esc</kbd>
              </div>

              {/* Résultats */}
              {results.length > 0 && (
                <div style={{ padding: '8px' }}>
                  {results.map((asset, i) => (
                    <div
                      key={asset.id}
                      onClick={() => handleSelect(asset)}
                      onMouseEnter={() => setActiveIndex(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                        backgroundColor: i === activeIndex ? '#e8f2dc' : 'transparent',
                        transition: 'background-color 0.1s',
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {canPreview(asset) ? (
                          <img src={asset.filepath} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                        ) : (
                          <span style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>{asset.filetype}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: i === activeIndex ? '#5d9228' : '#1f2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.filename}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '1px 0 0' }}>
                          {asset.metadata?.brand && <span>{asset.metadata.brand} · </span>}
                          {asset.filetype.toUpperCase()}
                          {asset.tags.length > 0 && <span> · {asset.tags.map(t => t.name).join(', ')}</span>}
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={i === activeIndex ? '#5d9228' : '#d1d5db'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              {/* Aucun résultat */}
              {query && results.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  Aucun résultat pour &ldquo;{query}&rdquo;
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: '8px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}><kbd style={{ backgroundColor: '#f1f3f5', borderRadius: '3px', padding: '1px 4px' }}>↑↓</kbd> naviguer</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}><kbd style={{ backgroundColor: '#f1f3f5', borderRadius: '3px', padding: '1px 4px' }}>↵</kbd> ouvrir</span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}><kbd style={{ backgroundColor: '#f1f3f5', borderRadius: '3px', padding: '1px 4px' }}>Ctrl+K</kbd> fermer</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
