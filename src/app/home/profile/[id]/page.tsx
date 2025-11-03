import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"
import { ErrorBoundary } from "@/app/components/errorBoundary"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
// import { getPosts } from "$/queries/post/getPosts";
import { createClient } from "$/supabase/server"
import { Post } from "$/types/data.types"
import ProfileView from "../components/profileView"
import {
  getIsDraftPostsByUser,
  getMintedPostsByUser,
  getPinnedPostsByUser,
  getPostsByUser,
  getPrivatePostsByUser,
  getUserLikedPosts,
} from "@/queries/post/getPostsByUser"
import UserData from "../components/userData"
import { Metadata } from "next"
import useUserData from "@/hooks/useUserData"
import { getUserById } from "@/queries/user/getUserById"
import dynamic from "next/dynamic"

type Props = {
  params: { slug: string } // Example if using dynamic routes
  searchParams: { [key: string]: string | undefined }
}

// Optimize metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ [key: string]: string | undefined }>
}): Promise<Metadata> {
  const paramsData = await params
  // Ensure params.id is available
  if (!paramsData?.id) {
    return {
      title: "Unreal Profile",
      description: "Profile page on Unreal",
    }
  }

  try {
    const supabaseSSR = await createClient()
    const data = await getUserById(paramsData.id, supabaseSSR)

    const username = data?.username || data?.full_name || "Unreal Creator"
    const avatarUrl = data?.avatar_url || ""
    const profileUrl = paramsData.id
      ? `https://art.ideomind.org/home/profile/${paramsData.id}`
      : "https://art.ideomind.org/home"

    return {
      title: `${username} | Unreal Profile`,
      description: `Check out ${username}'s creations on Unreal.`,
      openGraph: {
        type: "website",
        url: profileUrl,
        title: `${username} | Unreal Profile`,
        description: `Check out ${username}'s creations on Unreal.`,
        images: avatarUrl
          ? [
              {
                url: avatarUrl,
                width: 1200,
                height: 630,
                alt: `${username}'s profile picture`,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${username} | Unreal Profile`,
        description: `Check out ${username}'s creations on Unreal.`,
        images: avatarUrl ? [avatarUrl] : [],
      },
    }
  } catch (error) {
    // Fallback metadata if there's an error
    return {
      title: "Unreal Profile",
      description: "Profile page on Unreal",
    }
  }
}

export default async function Profile({
  searchParams,
  params,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
  params: Promise<{ [key: string]: string | undefined }>
}) {
  const supabaseSSR = await createClient()
  const queryClient = new QueryClient()
  const queryParams = await searchParams
  const paramsData = await params
  // Prefetch only the first page of data initially
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["creation_posts", queryParams?.s || "public"],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getInitialPosts(
        supabaseSSR,
        pageParam,
        paramsData?.id as string,
        queryParams?.s
      )
      return {
        data: result ?? [],
        nextCursor: result.length > 0 ? pageParam + 1 : undefined,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: { data: Post[]; nextCursor?: number }) =>
      lastPage?.nextCursor ?? undefined,
    pages: 1, // Only prefetch first page
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="relative flex flex-col items-center background-color-primary-1 px-1 md:px-10 w-full">
        <ErrorBoundary
          componentName="UserProfile"
          fallback={
            <div className="flex flex-col items-center justify-center w-full py-8">
              <p className="text-center text-lg text-primary-6 mb-4">
                Unable to load user profile
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-8 hover:bg-primary-7 text-white rounded-md transition-colors"
              >
                Reload Page
              </button>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="w-full max-w-7xl py-4">
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton
                    circle
                    width={80}
                    height={80}
                    baseColor="#1a1a1a"
                    highlightColor="#333"
                  />
                  <div className="flex-1">
                    <Skeleton
                      width={200}
                      height={24}
                      baseColor="#1a1a1a"
                      highlightColor="#333"
                      className="mb-2"
                    />
                    <Skeleton
                      width={150}
                      height={18}
                      baseColor="#1a1a1a"
                      highlightColor="#333"
                    />
                  </div>
                </div>
              </div>
            }
          >
            <UserData />
          </Suspense>

          <ErrorBoundary
            componentName="ProfileContent"
            fallback={
              <div className="flex flex-col items-center justify-center w-full py-8">
                <p className="text-center text-lg text-primary-6 mb-4">
                  Unable to load profile content
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-8 hover:bg-primary-7 text-white rounded-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="w-full max-w-7xl">
                  <div className="flex justify-center gap-4 mb-6">
                    {Array(5)
                      .fill(null)
                      .map((_, i) => (
                        <Skeleton
                          key={i}
                          width={80}
                          height={36}
                          baseColor="#1a1a1a"
                          highlightColor="#333"
                        />
                      ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(12)
                      .fill(null)
                      .map((_, i) => (
                        <Skeleton
                          key={i}
                          height={300}
                          baseColor="#1a1a1a"
                          highlightColor="#333"
                          className="rounded-lg"
                        />
                      ))}
                  </div>
                </div>
              }
            >
              <ProfileView />
            </Suspense>
          </ErrorBoundary>
        </ErrorBoundary>
      </div>
    </HydrationBoundary>
  )
}

// Separate function to handle initial post fetching logic
async function getInitialPosts(
  supabase: any,
  pageParam: number,
  userId: string,
  type?: string
) {
  switch (type?.toUpperCase()) {
    case "PUBLIC":
      return await getPostsByUser(supabase, pageParam, userId)
    case "PRIVATE":
      return await getPrivatePostsByUser(supabase, pageParam, userId)
    case "LIKED":
      return await getUserLikedPosts(supabase, pageParam, userId)
    case "PINNED":
      return await getPinnedPostsByUser(supabase, pageParam, userId)
    case "MINTED":
      return await getMintedPostsByUser(supabase, pageParam, userId)
    case "DRAFT":
      return await getIsDraftPostsByUser(supabase, pageParam, userId)
    default:
      return await getPostsByUser(supabase, pageParam, userId)
  }
}
