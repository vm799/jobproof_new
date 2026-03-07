import type { Metadata } from 'next'
import './globals.css'
import ChunkErrorHandler from './chunk-error-handler'

export const metadata: Metadata = {
  title: 'JobProof | Never Lose a Lien Claim Again',
  description: 'Offline-first field evidence for construction. Secure before/after photos, GPS, signatures, and cryptographic proof.',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  themeColor: '#141422',
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
    <html lang="en" className="overflow-x-hidden">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-stone-50 text-stone-800">
        <ChunkErrorHandler />
        {children}
      </body>
    </html>
  )
}
