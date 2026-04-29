import { NextRequest, NextResponse } from 'next/server'
import { getAssets, createAsset, findAssetByHash, updateAssetMetadata } from '@/lib/assets/queries'
import { computeHash, getFileType, saveFile } from '@/lib/assets/upload'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import type { Brand, AssetFormat, AssetStatus } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const filters = {
    brand: (searchParams.get('brand') as Brand) || undefined,
    filetype: (searchParams.get('filetype') as AssetFormat) || undefined,
    status: (searchParams.get('status') as AssetStatus) || undefined,
    search: searchParams.get('search') || undefined,
    tag: searchParams.get('tag') || undefined,
  }

  const assets = getAssets(filters)
  return NextResponse.json({ assets, total: assets.length })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  if (!session || session.role !== 'graphiste') {
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

  // Métadonnées obligatoires envoyées avec le fichier
  const name = (formData.get('name') as string | null)?.trim() || file.name
  const brand = formData.get('brand') as Brand | null
  const tagsRaw = formData.get('tags') as string | null
  const tags = tagsRaw ? JSON.parse(tagsRaw) as string[] : []
  const description = formData.get('description') as string | null
  const color = formData.get('color') as string | null
  const style = formData.get('style') as string | null

  const filepath = saveFile(buffer, hash, filetype)
  const assetId = createAsset({
    filename: name,
    filepath,
    filetype,
    hash,
    author: session.email,
  })

  updateAssetMetadata(assetId, {
    brand: brand ?? undefined,
    description: description ?? undefined,
    color: color ?? undefined,
    style: style ?? undefined,
    tags,
  })

  return NextResponse.json({ duplicate: false, assetId }, { status: 201 })
}
