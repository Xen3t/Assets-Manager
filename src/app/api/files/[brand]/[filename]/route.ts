import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { Brand } from '@/types'

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.eps': 'application/postscript',
}

function getBrandDir(brand: string): string {
  if (brand === 'CASANOOV') return process.env.UPLOAD_DIR_CASANOOV ?? join(process.cwd(), 'public', 'uploads', 'CASANOOV')
  if (brand === 'CAZEBOO')  return process.env.UPLOAD_DIR_CAZEBOO  ?? join(process.cwd(), 'public', 'uploads', 'CAZEBOO')
  if (brand === 'SICAAN')   return process.env.UPLOAD_DIR_SICAAN   ?? join(process.cwd(), 'public', 'uploads', 'SICAAN')
  return process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'uploads')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ brand: string; filename: string }> }
) {
  const { brand, filename } = await params

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Interdit', { status: 403 })
  }

  const brandDir = getBrandDir(brand)
  const filePath = join(brandDir, filename)

  // Fallback : cherche dans public/uploads (anciens assets)
  const fallback = join(process.cwd(), 'public', 'uploads', filename)
  const target = existsSync(filePath) ? filePath : existsSync(fallback) ? fallback : null

  if (!target) return new NextResponse('Introuvable', { status: 404 })

  const ext = extname(filename).toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'
  const buffer = readFileSync(target)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
