// KWIKSELLER Admin - Root Page Redirect
// Redirects to /admin if authenticated, or /login if not

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, UserRole } from '@kwikseller/utils'
import { Shield } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()
  
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const hasRole = useAuthStore((state) => state.hasRole)

  const isAuthenticated = !!user && !!tokens?.accessToken

  useEffect(() => {
    if (!isInitialized) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // If user is admin/super_admin, redirect to admin panel
    if (hasRole(['ADMIN', 'SUPER_ADMIN'])) {
      router.push('/admin')
      return
    }

    // For non-admin users, redirect to their appropriate dashboard
    const roleRedirects: Record<UserRole, string> = {
      BUYER: '/',
      VENDOR: '/dashboard',
      ADMIN: '/admin',
      RIDER: '/deliveries',
      SUPER_ADMIN: '/admin',
    }
    
    const redirectPath = user ? roleRedirects[user.role] : '/'
    router.push(redirectPath || '/')
  }, [isInitialized, isAuthenticated, router, hasRole, user])

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  return null
}
