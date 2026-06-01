import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Privileged Few — Daily Trend Radar',
  description: 'Daily content intelligence dashboard for @weareprivilegedfew',
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
