"use client"
import { ReactNode, useState, useEffect } from "react"
import { createClient } from "$/supabase/client"
import config from "$/config"
import { Provider } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

interface AuthBtnProps {
  icon: ReactNode
  children: string
  provider: Provider
}

export default function AuthBtn({ icon, children, provider }: AuthBtnProps) {
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const torusUser = searchParams?.get("torus_user") || null

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine)

    if (torusUser) {
      //set it in local storage
      localStorage.setItem("torusUser", torusUser)
    }

    // Set up listeners for online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleSignIn = () => {
    // If offline, redirect to offline page instead of attempting auth
    if (!isOnline) {
      router.replace("/offline.html")
      return
    }

    // First, create a state object that includes your torus user
    const state = {
      torusUser: torusUser ? torusUser : "",
      // Any other state you want to persist
    }
    console.log("state", state)

    // Encode it to base64
    const encodedState = btoa(JSON.stringify(state))

    //${torusUser ? `?torus_user=${encodeURIComponent(torusUser)}` : ""}`;
    // const redirectTo = `${config.domainName}/api/auth/callback`;

    const redirectTo = `${window.location.origin}/api/auth/callback`

    setLoading(true)
    try {
      const supabase = createClient()
      supabase.auth.signInWithOAuth({
        provider: provider ? provider : ("" as Provider),
        options: {
          redirectTo: redirectTo,
          // Use the supabase-specific parameter for passing custom data
          // queryParams: {
          //   // This is a special parameter that Supabase will pass through
          //   // It will be available in the final redirect URL
          //   torus_user: torusUser ? encodeURIComponent(torusUser) : "",

          // },
        },
      })
    } catch (error) {
      if (!navigator.onLine) {
        router.replace("/offline.html")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      className="border-primary-9 text-primary-6 rounded-full flex justify-center items-center h-10 w-[276px] border-[1px]"
      disabled={loading}
    >
      {icon}
      <p className="block w-40">{children}</p>
    </button>
  )
}
