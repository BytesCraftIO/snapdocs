'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function InvalidSessionHandler() {
  const router = useRouter()
  
  useEffect(() => {
    // Clear the invalid session and redirect to login
    signOut({ 
      redirect: false 
    }).then(() => {
      router.push('/login?error=InvalidSession')
    })
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Session Invalid</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your session is no longer valid. Redirecting to login...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
}