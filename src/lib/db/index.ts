import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { initSchema } from './schema'

const DB_PATH = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'assets.db')

mkdirSync(join(process.cwd(), 'data'), { recursive: true })

let _db: DatabaseSync | null = null
let _purgeScheduled = false

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH)
    _db.exec('PRAGMA journal_mode = WAL')
    _db.exec('PRAGMA foreign_keys = ON')
    initSchema(_db)

    // Purge des assets supprimés depuis plus de 30 jours — une seule fois par démarrage
    if (!_purgeScheduled) {
      _purgeScheduled = true
      setImmediate(async () => {
        const { purgeDeletedAssets } = await import('@/lib/assets/purge')
        purgeDeletedAssets()
      })
    }
  }
  return _db
}
