import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import { getDeletedAssets, purgeDeletedAssets } from '@/lib/assets/purge'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const assets = getDeletedAssets()
  return NextResponse.json({ assets, total: assets.length })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { purged } = purgeDeletedAssets()
  return NextResponse.json({ purged })
}
