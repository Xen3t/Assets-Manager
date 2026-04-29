import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import { updateUserRole, updateUserPassword, deleteUser, countGraphistes, listUsers } from '@/lib/admin/users'
import type { UserRole } from '@/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  if (body.role) {
    // Empêche de retirer le dernier graphiste
    if (body.role === 'visiteur' && countGraphistes() <= 1) {
      const users = listUsers()
      const target = users.find((u) => u.id === Number(id))
      if (target?.role === 'graphiste') {
        return NextResponse.json({ error: 'Impossible : dernier graphiste' }, { status: 400 })
      }
    }
    updateUserRole(Number(id), body.role as UserRole)
  }

  if (body.password) {
    await updateUserPassword(Number(id), body.password)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params

  // Empêche de supprimer le dernier graphiste
  if (countGraphistes() <= 1) {
    const users = listUsers()
    if (users.find((u) => u.id === Number(id) && u.role === 'graphiste')) {
      return NextResponse.json({ error: 'Impossible : dernier graphiste' }, { status: 400 })
    }
  }

  // Empêche de se supprimer soi-même
  if (session.userId === Number(id)) {
    return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 })
  }

  deleteUser(Number(id))
  return NextResponse.json({ ok: true })
}
