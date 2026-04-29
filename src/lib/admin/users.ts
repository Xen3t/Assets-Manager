import { getDb } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import type { UserRole } from '@/types'

interface DbUser {
  id: number
  email: string
  role: UserRole
  created_at: string
}

export function listUsers(): DbUser[] {
  return getDb().prepare('SELECT id, email, role, suspended, created_at FROM users ORDER BY created_at ASC').all() as unknown as DbUser[]
}

export async function createUser(email: string, password: string, role: UserRole): Promise<number> {
  const hash = await hashPassword(password)
  const result = getDb().prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(email, hash, role)
  return Number(result.lastInsertRowid)
}

export async function updateUserPassword(id: number, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword)
  getDb().prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id)
}

export function updateUserRole(id: number, role: UserRole): void {
  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
}

export function updateUserEmail(id: number, email: string): void {
  getDb().prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id)
}

export function suspendUser(id: number, suspended: boolean): void {
  getDb().prepare('UPDATE users SET suspended = ? WHERE id = ?').run(suspended ? 1 : 0, id)
}

export function deleteUser(id: number): void {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
}

export function countPrivileged(): number {
  const row = getDb().prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'graphiste')").get() as { count: number }
  return row.count
}
