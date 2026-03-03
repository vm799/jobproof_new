import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobProof | Never Lose a Lien Claim Again',
  description: 'Offline-first field evidence for construction. Secure before/after photos, GPS, signatures, and cryptographic proof.',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  themeColor: '#2563eb',
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
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
