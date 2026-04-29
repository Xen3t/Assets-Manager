import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import { updateUserRole, updateUserPassword, updateUserEmail, suspendUser, deleteUser, countPrivileged, listUsers } from '@/lib/admin/users'
import type { UserRole } from '@/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  if (body.role !== undefined) {
    if (countPrivileged() <= 1) {
      const users = listUsers()
      const target = users.find((u) => u.id === Number(id))
      if (target && (target.role === 'admin' || target.role === 'graphiste') && body.role === 'visiteur') {
        return NextResponse.json({ error: 'Impossible : dernier compte privilégié' }, { status: 400 })
      }
    }
    updateUserRole(Number(id), body.role as UserRole)
  }

  if (body.password) {
    await updateUserPassword(Number(id), body.password)
  }

  if (body.email) {
    updateUserEmail(Number(id), body.email)
  }

  if (body.suspended !== undefined) {
    suspendUser(Number(id), body.suspended)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params

  // Empêche de supprimer le dernier graphiste
  if (countPrivileged() <= 1) {
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
