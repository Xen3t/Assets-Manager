import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { AssetFormat } from '@/types'

const ALLOWED_TYPES: Record<string, AssetFormat> = {
  '.svg': 'svg',
  '.png': 'png',
  '.ico': 'ico',
  '.eps': 'eps',
}

export function getUploadDir(): string {
  const dir = join(process.cwd(), 'public', 'uploads')
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

export function saveFile(buffer: Buffer, hash: string, filetype: AssetFormat): string {
  const uploadDir = getUploadDir()
  const filename = `${hash}.${filetype}`
  const fullPath = join(uploadDir, filename)
  writeFileSync(fullPath, buffer)
  return `/uploads/${filename}`
}
