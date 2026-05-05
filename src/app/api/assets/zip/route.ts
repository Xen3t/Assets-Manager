import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import JSZip from 'jszip'
import { getAssetById } from '@/lib/assets/queries'

function resolveFilePath(filepath: string): string | null {
  // filepath is like /api/files/CASANOOV/hash.svg or /api/files/default/hash.svg
  const parts = filepath.split('/')
  const brand = parts[3]
  const filename = parts[4]

  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) return null

  let dir: string
  if (brand === 'CASANOOV') dir = process.env.UPLOAD_DIR_CASANOOV ?? join(process.cwd(), 'public', 'uploads', 'CASANOOV')
  else if (brand === 'CAZEBOO') dir = process.env.UPLOAD_DIR_CAZEBOO ?? join(process.cwd(), 'public', 'uploads', 'CAZEBOO')
  else if (brand === 'SICAAN') dir = process.env.UPLOAD_DIR_SICAAN ?? join(process.cwd(), 'public', 'uploads', 'SICAAN')
  else dir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'uploads')

  const primary = join(dir, filename)
  if (existsSync(primary)) return primary

  const fallback = join(process.cwd(), 'public', 'uploads', filename)
  if (existsSync(fallback)) return fallback

  return null
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const ids: unknown[] = Array.isArray(body?.ids) ? body.ids : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Aucun asset sélectionné' }, { status: 400 })
  }

  const zip = new JSZip()
  const seen = new Set<string>()

  for (const id of ids) {
    const asset = getAssetById(Number(id))
    if (!asset) continue

    const filePath = resolveFilePath(asset.filepath)
    if (!filePath) continue

    // Déduplique les noms de fichiers dans le zip
    let name = asset.filename
    if (seen.has(name)) {
      const dot = name.lastIndexOf('.')
      name = dot !== -1
        ? `${name.slice(0, dot)}_${asset.id}${name.slice(dot)}`
        : `${name}_${asset.id}`
    }
    seen.add(name)

    zip.file(name, readFileSync(filePath))
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="assets.zip"',
    },
  })
}
