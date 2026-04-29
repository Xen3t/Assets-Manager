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

export default function FilterBar({ filters, onChange, total }: Props) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Recherche */}
      <input
        type="search"
        placeholder="Rechercher…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className="h-9 rounded-[8px] border border-border bg-white px-3 text-sm text-text-primary outline-none transition-all focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 w-52"
      />

      {/* Brand */}
      <select
        value={filters.brand}
        onChange={(e) => set('brand', e.target.value)}
        className="h-9 rounded-[8px] border border-border bg-white px-3 text-sm text-text-primary outline-none cursor-pointer focus:border-brand-teal"
      >
        <option value="">Toutes les marques</option>
        {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>

      {/* Format */}
      <select
        value={filters.filetype}
        onChange={(e) => set('filetype', e.target.value)}
        className="h-9 rounded-[8px] border border-border bg-white px-3 text-sm text-text-primary outline-none cursor-pointer focus:border-brand-teal"
      >
        <option value="">Tous les formats</option>
        {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
      </select>

      {/* Statut */}
      <div className="flex rounded-[8px] border border-border bg-white overflow-hidden text-sm">
        {(['', 'active', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => set('status', s)}
            className={`px-3 h-9 transition-colors ${filters.status === s ? 'bg-brand-green text-white' : 'text-text-secondary hover:bg-background'}`}
          >
            {s === '' ? 'Tous' : s === 'active' ? 'Actifs' : 'Archivés'}
          </button>
        ))}
      </div>

      <span className="ml-auto text-sm text-text-disabled">{total} asset{total !== 1 ? 's' : ''}</span>
    </div>
  )
}
