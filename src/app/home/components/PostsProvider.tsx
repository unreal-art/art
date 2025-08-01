"use client"

import { supabase } from "$/supabase/client"
import {
  dehydrate,
  HydrationBoundary,
  useQueryClient,
} from "@tanstack/react-query"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  getFollowingPosts,
  getPosts,
  getTopPosts,
  getTopMintedPosts,
} from "@/queries/post/getPosts"
import Loading from "../loading"

// Define a type for the search type to improve type safety
type SearchType =
  | "EXPLORE"
  | "FOLLOWING"
  | "FEED"
  | "FEATURED_MINTS"
  | undefined

// Define response type to ensure proper typing
interface QueryResponse {
  data: any[]
  nextCursor: number | undefined
}

export default function PostsProvider({
  children,
  searchType,
}: {
  children: React.ReactNode
  searchType?: string
}) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const queryClient = useQueryClient()
  const isMounted = useRef(true)

  const torusUser = localStorage.getItem("torusUser")

  // Normalize searchType for consistency
  const normalizedSearchType =
    (searchType?.toUpperCase() as SearchType) || torusUser
      ? "FEATURED_MINTS"
      : "EXPLORE"

  useEffect(() => {
    // Set up mounted ref for cleanup
    isMounted.current = true

    const prefetchData = async () => {
      try {
        // Reset state on new prefetch
        setError(null)
        setIsHydrated(false)

        // Prefetch initial data based on search type
        await queryClient.prefetchInfiniteQuery({
          queryKey: ["posts", normalizedSearchType.toLowerCase()],
          queryFn: async ({ pageParam = 0 }) => {
            try {
              // @ts-ignore
              let result = []

              // Select the right query function based on search type
              switch (normalizedSearchType) {
                case "EXPLORE":
                  result = await getPosts(supabase, pageParam)
                  break
                case "FOLLOWING":
                  result = await getFollowingPosts(supabase, pageParam)
                  break
                case "FEED":
                  result = await getTopPosts(supabase, pageParam)
                  break

                case "FEATURED_MINTS":
                  result = await getTopMintedPosts(supabase, pageParam)
                  break
                default:
                  result = await getPosts(supabase, pageParam)
              }

              // Ensure result is an array to prevent runtime errors
              if (!Array.isArray(result)) {
                console.warn(
                  "Expected array result from API but got:",
                  typeof result
                )
                result = []
              }

              return {
                //@ts-ignore
                data: result,
                nextCursor: result.length > 0 ? pageParam + 1 : undefined,
              } as QueryResponse
            } catch (err) {
              console.error("Error fetching page data:", err)
              // Return empty result instead of throwing to prevent query failure
              return { data: [], nextCursor: undefined } as QueryResponse
            }
          },
          initialPageParam: 0,
          getNextPageParam: (lastPage: QueryResponse) => {
            // Safe access with type checking
            if (!lastPage || typeof lastPage !== "object") return undefined
            return "nextCursor" in lastPage ? lastPage.nextCursor : undefined
          },
        })

        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsHydrated(true)
        }
      } catch (err) {
        console.error("Error in data prefetching:", err)
        // Only update state if component is still mounted
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          // Set hydrated to true even on error to render children with empty state
          setIsHydrated(true)
        }
      }
    }

    prefetchData()

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted.current = false
    }
  }, [normalizedSearchType, queryClient])

  // Handle error state
  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        <p className="font-medium">Error loading data:</p>
        <p>{error.message}</p>
      </div>
    )
  }

  // Create a smoother transition between loading and hydrated states
  return (
    <div className="relative w-full h-full">
      {/* Loading indicator that fades out when data is hydrated */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center bg-black"
        style={{
          opacity: isHydrated ? 0 : 1,
          visibility: isHydrated ? "hidden" : "visible",
          transition: "opacity 0.3s ease-in-out",
          transitionDelay: isHydrated ? "0s" : "0.2s",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Simplified loading indicator */}
          <div className="relative animate-pulse">
            <Image
              src="/Icon-White.png"
              alt="unreal"
              height={50}
              width={50}
              priority
            />
          </div>
        </div>
      </div>

      {/* Always render content, but make it visible only when hydrated */}
      <div
        style={{
          opacity: isHydrated ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          transitionDelay: isHydrated ? "0.2s" : "0s",
        }}
      >
        <HydrationBoundary state={dehydrate(queryClient)}>
          {children}
        </HydrationBoundary>
      </div>
    </div>
  )
}
