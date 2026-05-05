'use client'

import type { AssetFormat } from '@/types'
import { MARQUES, MARQUE_LABELS, formatLabel, type Marque } from '@/lib/taxonomy'
import UploadZone from './UploadZone'

const FORMATS: AssetFormat[] = ['svg', 'png', 'ico', 'eps']

export interface Filters {
  search: string
  marque: Marque | ''
  filetype: AssetFormat | ''
  status: 'active' | 'archived' | ''
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  total: number
  onUploaded?: () => void
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function PillSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  formatOpt,
}: {
  value: T | ''
  onChange: (v: T | '') => void
  options: readonly T[]
  label: string
  formatOpt?: (v: T) => string
}) {
  const active = !!value
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | '')}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          height: '36px', paddingLeft: '14px', paddingRight: '32px',
          borderRadius: '10px',
          border: `1.5px solid ${active ? 'var(--brand-main)' : '#e5e7eb'}`,
          backgroundColor: active ? 'var(--brand-light)' : '#fff',
          color: active ? 'var(--brand-main)' : '#6b7280',
          fontSize: '13px', fontWeight: 500,
          cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
        }}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>{formatOpt ? formatOpt(o) : o}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: active ? 'var(--brand-main)' : '#9ca3af' }}>
        <ChevronIcon />
      </span>
    </div>
  )
}

export default function FilterBar({ filters, onChange, total, onUploaded }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = !!(filters.marque || filters.filetype || filters.search)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Ligne recherche */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '680px' }}>
        {onUploaded && <UploadZone onUploaded={onUploaded} iconOnly />}

        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <SearchIcon />
          </div>
          <input
            type="search"
            placeholder="Rechercher un asset…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            style={{
              width: '100%', height: '52px',
              borderRadius: '10px',
              border: '1.5px solid #e5e7eb',
              backgroundColor: '#fff',
              paddingLeft: '48px', paddingRight: '120px',
              fontSize: '15px', color: '#1f2937',
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#38a0ad'; e.target.style.boxShadow = '0 0 0 3px rgba(56,160,173,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
          />
          {!filters.search && (
            <kbd style={{
              position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '11px', color: '#9ca3af', backgroundColor: '#f1f3f5',
              borderRadius: '6px', padding: '3px 8px', pointerEvents: 'none', fontFamily: 'inherit',
            }}>
              Ctrl+K
            </kbd>
          )}
        </div>
      </div>

      {/* Pills de filtres */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>

        <PillSelect
          value={filters.marque}
          onChange={(v) => set('marque', v as Marque | '')}
          options={MARQUES}
          label="Marque"
          formatOpt={(v) => MARQUE_LABELS[v]}
        />

        <PillSelect
          value={filters.filetype}
          onChange={(v) => set('filetype', v as AssetFormat | '')}
          options={FORMATS}
          label="Format"
          formatOpt={(v) => v.toUpperCase()}
        />

        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: '', marque: '', filetype: '', status: '' })}
            style={{
              height: '36px', paddingLeft: '14px', paddingRight: '14px',
              borderRadius: '10px', border: '1.5px solid #e5e7eb',
              backgroundColor: '#fff', color: '#9ca3af',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Effacer
          </button>
        )}

        <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: '4px' }}>
          {total} asset{total !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
