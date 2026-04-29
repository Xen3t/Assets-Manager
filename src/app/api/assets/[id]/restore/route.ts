import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import { updateAssetStatus, getAssetById } from '@/lib/assets/queries'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  updateAssetStatus(Number(id), 'active')
  const asset = getAssetById(Number(id))
  return NextResponse.json(asset)
}
