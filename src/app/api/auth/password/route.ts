import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import { verifyPassword } from '@/lib/auth/password'
import { updateUserPassword } from '@/lib/admin/users'
import { getDb } from '@/lib/db'
import type { DbUser } from '@/types'

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as DbUser | undefined
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const valid = await verifyPassword(currentPassword, user.password)
  if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })

  await updateUserPassword(session.userId, newPassword)
  return NextResponse.json({ ok: true })
}
