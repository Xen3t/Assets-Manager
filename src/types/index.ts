export type { Marque, Couleur } from '@/lib/taxonomy'

export type AssetStatus = 'active' | 'archived' | 'deleted'

export type AssetFormat = 'svg' | 'png' | 'ico' | 'eps'

export type UserRole = 'admin' | 'graphiste' | 'visiteur'

export interface Asset {
  id: number
  filename: string
  filepath: string
  filetype: AssetFormat
  hash: string
  version: number
  status: AssetStatus
  createdAt: string
  author?: string
}

export interface AssetMetadata {
  assetId: number
  marque?: string
  type?: string
  gamme?: string
  couleur?: string
  description?: string
}

export interface AssetWithDetails extends Asset {
  metadata?: AssetMetadata
  currentVersion: AssetVersion
}

export interface AssetVersion {
  id: number
  assetId: number
  versionNumber: number
  filepath: string
  createdAt: string
}

export interface User {
  id: number
  email: string
  role: UserRole
  suspended: boolean
  createdAt: string
}

export interface DbUser extends Omit<User, 'createdAt' | 'suspended'> {
  password: string
  suspended: number
  created_at: string
}

export interface Session {
  userId: number
  email: string
  role: UserRole
}
