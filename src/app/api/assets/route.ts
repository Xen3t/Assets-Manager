import { NextRequest, NextResponse } from 'next/server'
import { getAssets, createAsset, findAssetByHash, updateAssetMetadata } from '@/lib/assets/queries'
import { computeHash, getFileType, saveFile } from '@/lib/assets/upload'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import type { AssetFormat, AssetStatus } from '@/types'
import type { Marque, Couleur } from '@/lib/taxonomy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const filters = {
    marque: (searchParams.get('marque') as Marque) || undefined,
    filetype: (searchParams.get('filetype') as AssetFormat) || undefined,
    status: (searchParams.get('status') as AssetStatus) || undefined,
    search: searchParams.get('search') || undefined,
  }

  const assets = getAssets(filters)
  return NextResponse.json({ assets, total: assets.length })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  if (!session || (session.role !== 'graphiste' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
  }

  const filetype = getFileType(file.name)
  if (!filetype) {
    return NextResponse.json(
      { error: 'Format non supporté. Acceptés : SVG, PNG, ICO, EPS' },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const hash = computeHash(buffer)

  const existing = findAssetByHash(hash)
  if (existing) {
    return NextResponse.json({ duplicate: true, asset: existing }, { status: 200 })
  }

  const name = (formData.get('name') as string | null)?.trim() || file.name
  const marque = formData.get('marque') as Marque | null
  const type = formData.get('type') as string | null
  const gamme = (formData.get('gamme') as string | null) || null
  const couleur = formData.get('couleur') as Couleur | null
  const description = formData.get('description') as string | null

  const filepath = saveFile(buffer, hash, filetype, marque)
  const assetId = createAsset({
    filename: name,
    filepath,
    filetype,
    hash,
    author: session.email,
  })

  updateAssetMetadata(assetId, {
    marque: marque ?? undefined,
    type: type ?? undefined,
    gamme: gamme ?? undefined,
    couleur: couleur ?? undefined,
    description: description ?? undefined,
  })

  return NextResponse.json({ duplicate: false, assetId }, { status: 201 })
}
