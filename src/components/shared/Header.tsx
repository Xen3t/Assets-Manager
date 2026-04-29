'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import UploadZone from '@/components/library/UploadZone'
import type { Session } from '@/types'

const NAV = [
  { href: '/', label: 'Bibliothèque', roles: ['graphiste', 'visiteur'] },
  { href: '/trash', label: 'Corbeille', roles: ['graphiste'] },
  { href: '/admin', label: 'Admin', roles: ['graphiste'] },
] as const

export default function Header({ session, onUploaded }: { session: Session; onUploaded?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const visibleNav = NAV.filter((n) => (n.roles as readonly string[]).includes(session.role))

  return (
    <header className="flex h-14 items-center gap-6 border-b border-border bg-surface px-6">
      <span className="text-sm font-semibold text-text-primary shrink-0">Assets Manager</span>

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1">
        {visibleNav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-[8px] px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-brand-green text-white font-medium'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Upload — graphistes uniquement */}
      {session.role === 'graphiste' && onUploaded && (
        <UploadZone onUploaded={onUploaded} />
      )}

      {/* User menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-background"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
            {session.email[0].toUpperCase()}
          </span>
          <span className="max-w-40 truncate">{session.email}</span>
          <span className="text-xs text-text-disabled">▾</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 top-10 z-20 w-52 rounded-[12px] border border-border bg-surface p-1"
              style={{ boxShadow: 'var(--shadow-default)' }}
            >
              <div className="px-3 py-2 text-xs text-text-disabled capitalize">{session.role}</div>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={handleLogout}
                className="w-full rounded-[8px] px-3 py-2 text-left text-sm text-brand-red transition-colors hover:bg-brand-red-light"
              >
                Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
