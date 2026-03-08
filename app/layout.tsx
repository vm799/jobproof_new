import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ChunkErrorHandler from './chunk-error-handler'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#141422',
}

export const metadata: Metadata = {
  title: 'JobProof | Never Lose a Lien Claim Again',
  description: 'Offline-first field evidence for construction. Secure before/after photos, GPS, signatures, and cryptographic proof.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JobProof',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-180.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`overflow-x-hidden ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-stone-50 text-stone-800 font-sans">
        <ChunkErrorHandler />
        {children}
      </body>
    </html>
  )
}
