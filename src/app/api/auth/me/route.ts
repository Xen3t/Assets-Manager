import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const session = await verifySession(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  return NextResponse.json({ userId: session.userId, email: session.email, role: session.role })
}
