import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import ArchivesClient from './ArchivesClient'

export default async function ArchivesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  if (!session || (session.role !== 'graphiste' && session.role !== 'admin')) redirect('/')

  return <ArchivesClient session={session} />
}
