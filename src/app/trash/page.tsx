import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession, COOKIE_NAME } from '@/lib/auth/session'
import TrashClient from './TrashClient'

export default async function TrashPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const session = token ? await verifySession(token) : null

  if (!session) redirect('/login')
  if (session.role !== 'graphiste') redirect('/')

  return <TrashClient session={session} />
}
