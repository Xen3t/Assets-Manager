export type Brand = 'CASANOOV' | 'CAZEBOO' | 'SICAAN'

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
  brand?: Brand
  description?: string
  color?: string
  style?: string
}

export interface Tag {
  id: number
  name: string
}

export interface AssetWithDetails extends Asset {
  metadata?: AssetMetadata
  tags: Tag[]
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

// Type interne pour les lignes retournées par SQLite (inclut le hash du mot de passe)
export interface DbUser extends Omit<User, 'createdAt' | 'suspended'> {
  password: string
  suspended: number  // SQLite retourne 0/1
  created_at: string
}

export interface Session {
  userId: number
  email: string
  role: UserRole
}
