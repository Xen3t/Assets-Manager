import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import { getAssetById, updateAssetFile } from '@/lib/assets/queries'
import { computeHash, getFileType, saveFile } from '@/lib/assets/upload'
import type { Marque } from '@/lib/taxonomy'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null
  if (!session || (session.role !== 'graphiste' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const assetId = Number(id)
  const asset = getAssetById(assetId)
  if (!asset) return NextResponse.json({ error: 'Asset introuvable' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

  const filetype = getFileType(file.name)
  if (!filetype) return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const hash = computeHash(buffer)

  if (hash === asset.hash) {
    return NextResponse.json({ error: 'Fichier identique à la version actuelle' }, { status: 400 })
  }

  const marque = asset.metadata?.marque as Marque | undefined
  const filepath = saveFile(buffer, hash, filetype, marque)
  updateAssetFile(assetId, filepath, hash)

  return NextResponse.json({ ok: true, version: asset.version + 1 })
}
