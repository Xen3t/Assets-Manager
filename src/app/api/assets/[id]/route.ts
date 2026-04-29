import { NextRequest, NextResponse } from 'next/server'
import { getAssetById, updateAssetMetadata, updateAssetStatus } from '@/lib/assets/queries'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import type { AssetStatus } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const asset = getAssetById(Number(id))
  if (!asset) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(asset)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const assetId = Number(id)
  const body = await req.json()

  if (body.status) {
    updateAssetStatus(assetId, body.status as AssetStatus)
  } else {
    updateAssetMetadata(assetId, body)
  }

  const updated = getAssetById(assetId)
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || session.role !== 'graphiste' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  updateAssetStatus(Number(id), 'deleted')
  return NextResponse.json({ ok: true })
}
