import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { AssetFormat, Brand } from '@/types'

const ALLOWED_TYPES: Record<string, AssetFormat> = {
  '.svg': 'svg',
  '.png': 'png',
  '.ico': 'ico',
  '.eps': 'eps',
}

export function getBrandUploadDir(brand?: Brand | null): string {
  let dir: string
  if (brand === 'CASANOOV') {
    dir = process.env.UPLOAD_DIR_CASANOOV ?? join(process.cwd(), 'public', 'uploads', 'CASANOOV')
  } else if (brand === 'CAZEBOO') {
    dir = process.env.UPLOAD_DIR_CAZEBOO ?? join(process.cwd(), 'public', 'uploads', 'CAZEBOO')
  } else if (brand === 'SICAAN') {
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

export function saveFile(buffer: Buffer, hash: string, filetype: AssetFormat, brand?: Brand | null): string {
  const uploadDir = getBrandUploadDir(brand)
  const filename = `${hash}.${filetype}`
  const fullPath = join(uploadDir, filename)
  writeFileSync(fullPath, buffer)
  const brandSegment = brand ?? 'default'
  return `/api/files/${brandSegment}/${filename}`
}
