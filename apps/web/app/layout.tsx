import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChurchOS — Church Production System',
  description: 'Enterprise-grade church presentation and live production system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
