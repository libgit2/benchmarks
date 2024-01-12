import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'libgit2 benchmarks',
  description: 'libgit2 benchmarks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
