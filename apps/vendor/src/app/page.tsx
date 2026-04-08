// KWIKSELLER Vendor Dashboard - Landing Page
// Redirects to dashboard if authenticated, or login if not

'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@kwikseller/utils"

export default function VendorPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const isAuthenticated = !!user && !!tokens?.accessToken

  useEffect(() => {
    if (!isInitialized) return

    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [isInitialized, isAuthenticated, router])

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  )
}
