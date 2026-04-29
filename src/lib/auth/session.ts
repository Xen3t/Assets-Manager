import { SignJWT, jwtVerify } from 'jose'
import type { Session } from '@/types'

const COOKIE_NAME = 'session'
const SESSION_DURATION_DAYS = 7

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET manquant dans les variables d\'environnement')
  return new TextEncoder().encode(secret)
}

export async function createSession(payload: Session): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as Session
  } catch {
    return null
  }
}

export { COOKIE_NAME, SESSION_DURATION_DAYS }
