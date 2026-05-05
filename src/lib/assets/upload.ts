import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { AssetFormat } from '@/types'
import type { Marque } from '@/lib/taxonomy'

const ALLOWED_TYPES: Record<string, AssetFormat> = {
  '.svg': 'svg',
  '.png': 'png',
  '.ico': 'ico',
  '.eps': 'eps',
}

export function getMarqueUploadDir(marque?: Marque | null): string {
  const key = marque?.toUpperCase() ?? null
  let dir: string
  if (key === 'CASANOOV') {
    dir = process.env.UPLOAD_DIR_CASANOOV ?? join(process.cwd(), 'public', 'uploads', 'CASANOOV')
  } else if (key === 'CAZEBOO') {
    dir = process.env.UPLOAD_DIR_CAZEBOO ?? join(process.cwd(), 'public', 'uploads', 'CAZEBOO')
  } else if (key === 'SICAAN') {
    dir = process.env.UPLOAD_DIR_SICAAN ?? join(process.cwd(), 'public', 'uploads', 'SICAAN')
  } else {
    dir = process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'uploads')
  }
  mkdirSync(dir, { recursive: true })
  return dir
}

export function computeHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

export function getFileType(filename: string): AssetFormat | null {
  const ext = extname(filename).toLowerCase()
  return ALLOWED_TYPES[ext] ?? null
}

export function saveFile(buffer: Buffer, hash: string, filetype: AssetFormat, marque?: Marque | null): string {
  const uploadDir = getMarqueUploadDir(marque)
  const filename = `${hash}.${filetype}`
  const fullPath = join(uploadDir, filename)
  writeFileSync(fullPath, buffer)
  const segment = marque?.toUpperCase() ?? 'default'
  return `/api/files/${segment}/${filename}`
}
