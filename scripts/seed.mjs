/**
 * Crée un utilisateur initial dans la base de données.
 * Usage : node scripts/seed.mjs
 */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'

const DB_PATH = process.env.DATABASE_PATH ?? join(process.cwd(), 'data', 'assets.db')
mkdirSync(join(process.cwd(), 'data'), { recursive: true })

const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL CHECK(role IN ('graphiste', 'visiteur')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

const users = [
  { email: 'media@hoortrade.com', password: 'admin1234', role: 'graphiste' },
]

const insert = db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?, ?, ?)')

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 12)
  insert.run(u.email, hash, u.role)
  console.log(`✓ ${u.role} créé : ${u.email}`)
}

console.log('\nSeed terminé. Lance npm run dev et connecte-toi.')
