import { cookies } from 'next/headers'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import LibraryClient from './LibraryClient'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  return <LibraryClient session={session} />
}
