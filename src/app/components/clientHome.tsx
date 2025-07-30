"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { createClient } from "$/supabase/client"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"

// Improved loading component with fade-in animation
const LoadingScreen = () => (
  <div className="h-[100dvh] w-screen flex items-center justify-center bg-primary-13 animate-fadeIn">
    <div className="relative">
      <Image
        src="/Icon-White.png"
        alt="unreal"
        height={50}
        width={50}
        priority
        className="animate-pulse"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-effect"></div>
    </div>
  </div>
)

/**
 * ClientHome component handles:
 * 1. Offline detection and redirection to offline page
 * 2. Client-side authentication check as a fallback
 * 3. Auth state change listener
 */
export default function ClientHome() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOffline, setIsOffline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Handle offline status
  useEffect(() => {
    // Check current online status
    setIsOffline(!navigator.onLine)

    // Set up online/offline listeners
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Extract common redirect logic to reduce code duplication
  const redirectToOffline = () => {
    const from = pathname?.replace(/^\/{1,}|\/{1,}$/g, "") || ""
    if (from && !from.includes("offline")) {
      router.replace(`/offline.html?from=${from}`)
    } else {
      router.replace("/offline.html")
    }
  }

  // Handle authentication and redirects
  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      // Handle offline state
      if (isOffline) {
        redirectToOffline()
        return
      }

      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        console.log("getUser", user)

        // Only navigate if component is still mounted
        if (mounted) {
          if (user) {
            router.replace("/home")
          } else {
            router.replace("/auth")
          }
        }
      } catch (error) {
        if (mounted) {
          // Handle network errors
          if (!navigator.onLine || error instanceof TypeError) {
            redirectToOffline()
          } else {
            router.replace("/auth")
          }
          setIsLoading(false)
        }
      }
    }

    // Set up auth state change listener
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          if (isOffline) {
            redirectToOffline()
          } else if (session) {
            router.replace("/home")
          } else {
            router.replace("/auth")
          }
        }
      }
    )

    // Run the auth check
    checkAuth()

    // Cleanup function
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, isOffline, pathname])

  // Use pointer-events-none to prevent interaction during loading
  return (
    <div
      className={`transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0"
      } pointer-events-none`}
    >
      <LoadingScreen />
    </div>
  )
}
