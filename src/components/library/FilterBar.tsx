'use client'

import type { Brand, AssetFormat } from '@/types'

const BRANDS: Brand[] = ['CASANOOV', 'CAZEBOO', 'SICAAN']
const FORMATS: AssetFormat[] = ['svg', 'png', 'ico', 'eps']

export interface Filters {
  search: string
  brand: Brand | ''
  filetype: AssetFormat | ''
  status: 'active' | 'archived' | ''
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  total: number
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

export default function FilterBar({ filters, onChange, total }: Props) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const activeBrand = filters.brand
  const activeFormat = filters.filetype

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Barre de recherche large */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '680px' }}>
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

      {/* Pills de filtres */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Marque */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.brand}
            onChange={(e) => set('brand', e.target.value)}
            style={{
              appearance: 'none', WebkitAppearance: 'none',
              height: '36px', paddingLeft: '14px', paddingRight: '32px',
              borderRadius: '10px',
              border: `1.5px solid ${activeBrand ? '#5d9228' : '#e5e7eb'}`,
              backgroundColor: activeBrand ? '#e8f2dc' : '#fff',
              color: activeBrand ? '#5d9228' : '#6b7280',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
            }}
          >
            <option value="">Marque</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: activeBrand ? '#5d9228' : '#9ca3af' }}>
            <ChevronIcon />
          </span>
        </div>

        {/* Format */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.filetype}
            onChange={(e) => set('filetype', e.target.value)}
            style={{
              appearance: 'none', WebkitAppearance: 'none',
              height: '36px', paddingLeft: '14px', paddingRight: '32px',
              borderRadius: '10px',
              border: `1.5px solid ${activeFormat ? '#5d9228' : '#e5e7eb'}`,
              backgroundColor: activeFormat ? '#e8f2dc' : '#fff',
              color: activeFormat ? '#5d9228' : '#6b7280',
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
            }}
          >
            <option value="">Format</option>
            {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
          </select>
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: activeFormat ? '#5d9228' : '#9ca3af' }}>
            <ChevronIcon />
          </span>
        </div>

        {/* Reset si filtres actifs */}
        {(activeBrand || activeFormat || filters.search) && (
          <button
            onClick={() => onChange({ search: '', brand: '', filetype: '', status: '' })}
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
