import { unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getDb } from '@/lib/db'

const PURGE_DAYS = 30

interface DeletedAsset {
  id: number
  filepath: string
}

export function purgeDeletedAssets(): { purged: number } {
  const db = getDb()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - PURGE_DAYS)

  const toDelete = db.prepare(`
    SELECT id, filepath FROM assets
    WHERE status = 'deleted' AND deleted_at < ?
  `).all(cutoff.toISOString()) as unknown as DeletedAsset[]

  if (!toDelete.length) return { purged: 0 }

  for (const asset of toDelete) {
    // Supprime le fichier physique
    const fullPath = join(process.cwd(), 'public', asset.filepath)
    if (existsSync(fullPath)) {
      try { unlinkSync(fullPath) } catch { /* fichier déjà supprimé */ }
    }

    // Supprime de la DB (cascade sur asset_metadata, asset_tags, asset_versions)
    db.prepare('DELETE FROM assets WHERE id = ?').run(asset.id)
  }

  return { purged: toDelete.length }
}

export function getDeletedAssets() {
  const db = getDb()

  return db.prepare(`
    SELECT
      a.*,
      m.brand, m.description, m.color, m.style,
      GROUP_CONCAT(t.name) as tags
    FROM assets a
    LEFT JOIN asset_metadata m ON m.asset_id = a.id
    LEFT JOIN asset_tags at2 ON at2.asset_id = a.id
    LEFT JOIN tags t ON t.id = at2.tag_id
    WHERE a.status = 'deleted'
    GROUP BY a.id
    ORDER BY a.deleted_at DESC
  `).all()
}
