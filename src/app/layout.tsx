import type { Metadata } from 'next'
import { Titillium_Web } from 'next/font/google'
import './globals.css'

const titilliumWeb = Titillium_Web({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-titillium',
})

export const metadata: Metadata = {
  title: 'Assets Manager',
  description: 'Bibliothèque interne d\'assets graphiques — HoorTrade',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={titilliumWeb.variable}>
      <body>{children}</body>
    </html>
  )
}
