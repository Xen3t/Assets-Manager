import { getDb } from '@/lib/db'
import type { AssetWithDetails, AssetFormat, AssetStatus } from '@/types'
import type { Marque, Couleur } from '@/lib/taxonomy'

export interface AssetFilters {
  marque?: Marque
  filetype?: AssetFormat
  status?: AssetStatus
  search?: string
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
  marque: string | null
  type: string | null
  gamme: string | null
  couleur: string | null
  description: string | null
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
      marque: row.marque ?? undefined,
      type: row.type ?? undefined,
      gamme: row.gamme ?? undefined,
      couleur: row.couleur ?? undefined,
      description: row.description ?? undefined,
    },
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
  if (filters.marque) {
    conditions.push('m.marque = ?')
    params.push(filters.marque)
  }
  if (filters.filetype) {
    conditions.push('a.filetype = ?')
    params.push(filters.filetype)
  }
  if (filters.search) {
    conditions.push('(a.filename LIKE ? OR m.description LIKE ? OR m.gamme LIKE ? OR m.type LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = db.prepare(`
    SELECT a.*, m.marque, m.type, m.gamme, m.couleur, m.description
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    ${where}
    ORDER BY a.created_at DESC
  `).all(...(params as Parameters<typeof db.prepare>)) as unknown as DbRow[]

  return rows.map(rowToAsset)
}

export function getAssetById(id: number): AssetWithDetails | null {
  const db = getDb()
  const row = db.prepare(`
    SELECT a.*, m.marque, m.type, m.gamme, m.couleur, m.description
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    WHERE a.id = ?
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
  data: Partial<{
    marque: Marque
    type: string
    gamme: string
    couleur: Couleur
    description: string
    author: string
  }>
): void {
  const db = getDb()

  const { author, ...meta } = data

  if (Object.keys(meta).length > 0) {
    db.prepare(`
      UPDATE asset_metadata
      SET marque      = COALESCE(?, marque),
          type        = COALESCE(?, type),
          gamme       = COALESCE(?, gamme),
          couleur     = COALESCE(?, couleur),
          description = COALESCE(?, description)
      WHERE asset_id = ?
    `).run(
      meta.marque ?? null,
      meta.type ?? null,
      meta.gamme ?? null,
      meta.couleur ?? null,
      meta.description ?? null,
      assetId
    )
  }

  if (author !== undefined) {
    db.prepare('UPDATE assets SET author = ? WHERE id = ?').run(author, assetId)
  }
}

export function updateAssetStatus(assetId: number, status: AssetStatus): void {
  const db = getDb()
  const deletedAt = status === 'deleted' ? new Date().toISOString() : null
  db.prepare('UPDATE assets SET status = ?, deleted_at = ? WHERE id = ?').run(status, deletedAt, assetId)
}

export function updateAssetFilename(assetId: number, filename: string): void {
  const db = getDb()
  db.prepare('UPDATE assets SET filename = ? WHERE id = ?').run(filename.trim(), assetId)
}

export function updateAssetFile(assetId: number, newFilepath: string, newHash: string): void {
  const db = getDb()
  const current = db.prepare('SELECT filepath, hash, version FROM assets WHERE id = ?').get(assetId) as { filepath: string; hash: string; version: number } | undefined
  if (!current) return
  db.prepare('INSERT INTO asset_versions (asset_id, version_number, filepath, hash) VALUES (?, ?, ?, ?)').run(assetId, current.version, current.filepath, current.hash)
  db.prepare('UPDATE assets SET filepath = ?, hash = ?, version = version + 1 WHERE id = ?').run(newFilepath, newHash, assetId)
}

export function findAssetByHash(hash: string): AssetWithDetails | null {
  const db = getDb()
  const row = db.prepare(`
    SELECT a.*, m.marque, m.type, m.gamme, m.couleur, m.description
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    WHERE a.hash = ? AND a.status != 'deleted'
    LIMIT 1
  `).get(hash) as DbRow | undefined

  return row ? rowToAsset(row) : null
}
