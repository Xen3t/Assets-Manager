import { getDb } from '@/lib/db'
import type { AssetWithDetails, Brand, AssetFormat, AssetStatus } from '@/types'

export interface AssetFilters {
  brand?: Brand
  filetype?: AssetFormat
  status?: AssetStatus
  search?: string
  tag?: string
}

interface DbRow {
  id: number
  filename: string
  filepath: string
  filetype: string
  hash: string
  version: number
  status: string
  deleted_at: string | null
  author: string | null
  created_at: string
  brand: string | null
  description: string | null
  color: string | null
  style: string | null
  tags: string | null
}

function rowToAsset(row: DbRow): AssetWithDetails {
  return {
    id: row.id,
    filename: row.filename,
    filepath: row.filepath,
    filetype: row.filetype as AssetFormat,
    hash: row.hash,
    version: row.version,
    status: row.status as AssetStatus,
    author: row.author ?? undefined,
    createdAt: row.created_at,
    metadata: {
      assetId: row.id,
      brand: (row.brand as Brand) ?? undefined,
      description: row.description ?? undefined,
      color: row.color ?? undefined,
      style: row.style ?? undefined,
    },
    tags: row.tags
      ? row.tags.split(',').map((t, i) => ({ id: i, name: t.trim() }))
      : [],
    currentVersion: {
      id: 0,
      assetId: row.id,
      versionNumber: row.version,
      filepath: row.filepath,
      createdAt: row.created_at,
    },
  }
}

export function getAssets(filters: AssetFilters = {}): AssetWithDetails[] {
  const db = getDb()
  const conditions: string[] = ["a.status != 'deleted'"]
  const params: unknown[] = []

  if (filters.status) {
    conditions.pop()
    conditions.push('a.status = ?')
    params.push(filters.status)
  }
  if (filters.brand) {
    conditions.push('m.brand = ?')
    params.push(filters.brand)
  }
  if (filters.filetype) {
    conditions.push('a.filetype = ?')
    params.push(filters.filetype)
  }
  if (filters.search) {
    conditions.push('(a.filename LIKE ? OR m.description LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }
  if (filters.tag) {
    conditions.push('EXISTS (SELECT 1 FROM asset_tags at2 JOIN tags t ON t.id = at2.tag_id WHERE at2.asset_id = a.id AND t.name LIKE ?)')
    params.push(`%${filters.tag}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = db.prepare(`
    SELECT
      a.*,
      m.brand, m.description, m.color, m.style,
      GROUP_CONCAT(t.name) as tags
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    LEFT JOIN asset_tags at2 ON at2.asset_id = a.id
    LEFT JOIN tags t ON t.id = at2.tag_id
    ${where}
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all(...(params as Parameters<typeof db.prepare>)) as unknown as DbRow[]

  return rows.map(rowToAsset)
}

export function getAssetById(id: number): AssetWithDetails | null {
  const db = getDb()
  const row = db.prepare(`
    SELECT
      a.*,
      m.brand, m.description, m.color, m.style,
      GROUP_CONCAT(t.name) as tags
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    LEFT JOIN asset_tags at2 ON at2.asset_id = a.id
    LEFT JOIN tags t ON t.id = at2.tag_id
    WHERE a.id = ?
    GROUP BY a.id
  `).get(id) as DbRow | undefined

  return row ? rowToAsset(row) : null
}

export function createAsset(data: {
  filename: string
  filepath: string
  filetype: AssetFormat
  hash: string
  author?: string
}): number {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO assets (filename, filepath, filetype, hash, author)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.filename, data.filepath, data.filetype, data.hash, data.author ?? null)

  const assetId = Number(result.lastInsertRowid)

  db.prepare('INSERT INTO asset_metadata (asset_id) VALUES (?)').run(assetId)
  db.prepare(`
    INSERT INTO asset_versions (asset_id, version_number, filepath, hash)
    VALUES (?, 1, ?, ?)
  `).run(assetId, data.filepath, data.hash)

  return assetId
}

export function updateAssetMetadata(
  assetId: number,
  data: Partial<{ brand: Brand; description: string; color: string; style: string; author: string; tags: string[] }>
): void {
  const db = getDb()

  if (data.brand !== undefined || data.description !== undefined || data.color !== undefined || data.style !== undefined) {
    db.prepare(`
      UPDATE asset_metadata
      SET brand = COALESCE(?, brand),
          description = COALESCE(?, description),
          color = COALESCE(?, color),
          style = COALESCE(?, style)
      WHERE asset_id = ?
    `).run(data.brand ?? null, data.description ?? null, data.color ?? null, data.style ?? null, assetId)
  }

  if (data.author !== undefined) {
    db.prepare('UPDATE assets SET author = ? WHERE id = ?').run(data.author, assetId)
  }

  if (data.tags) {
    db.prepare('DELETE FROM asset_tags WHERE asset_id = ?').run(assetId)
    for (const name of data.tags) {
      const trimmed = name.trim()
      if (!trimmed) continue
      db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(trimmed)
      const tag = db.prepare('SELECT id FROM tags WHERE name = ? COLLATE NOCASE').get(trimmed) as { id: number }
      db.prepare('INSERT OR IGNORE INTO asset_tags (asset_id, tag_id) VALUES (?, ?)').run(assetId, tag.id)
    }
  }
}

export function updateAssetStatus(assetId: number, status: AssetStatus): void {
  const db = getDb()
  const deletedAt = status === 'deleted' ? new Date().toISOString() : null
  db.prepare('UPDATE assets SET status = ?, deleted_at = ? WHERE id = ?').run(status, deletedAt, assetId)
}

export function updateAssetFile(assetId: number, newFilepath: string, newHash: string): void {
  const db = getDb()
  const current = db.prepare('SELECT filepath, hash, version FROM assets WHERE id = ?').get(assetId) as { filepath: string; hash: string; version: number } | undefined
  if (!current) return
  // Archive l'ancienne version
  db.prepare('INSERT INTO asset_versions (asset_id, version_number, filepath, hash) VALUES (?, ?, ?, ?)').run(assetId, current.version, current.filepath, current.hash)
  // Met à jour l'asset
  db.prepare('UPDATE assets SET filepath = ?, hash = ?, version = version + 1 WHERE id = ?').run(newFilepath, newHash, assetId)
}

export function findAssetByHash(hash: string): AssetWithDetails | null {
  const db = getDb()
  const row = db.prepare(`
    SELECT a.*, m.brand, m.description, m.color, m.style, GROUP_CONCAT(t.name) as tags
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    LEFT JOIN asset_tags at2 ON at2.asset_id = a.id
    LEFT JOIN tags t ON t.id = at2.tag_id
    WHERE a.hash = ? AND a.status != 'deleted'
    GROUP BY a.id
    LIMIT 1
  `).get(hash) as DbRow | undefined

  return row ? rowToAsset(row) : null
}
