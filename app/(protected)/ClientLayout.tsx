'use client'

import { SocketProvider } from '@/lib/socket/client'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  )
}