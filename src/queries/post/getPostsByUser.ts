import { Client } from "$/supabase/client"
import { Post, UploadResponse } from "$/types/data.types"
import { getRange } from "@/utils"
import { LIST_LIMIT } from "@/app/libs/constants"
import { logError, logWarning } from "@/utils/sentryUtils"

export async function getPostsByUser(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }

    id = userData?.user?.id

    // Check for both undefined and string "null"
    if (!id || id === "null" || id === "") {
      // Instead of throwing an error, return an empty array
      console.warn("No valid user ID provided, returning empty posts array")
      return []
    }
  }

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("author", id)
    .neq("isPrivate", true)
    .neq("isDraft", true)
    .or("ipfsImages.not.is.null,video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("createdAt", { ascending: false })
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching user posts", error)
    throw new Error(error.message)
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }))
}

export async function getOtherPostsByUser(
  client: Client,
  start = 0,
  postId: number,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for other posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("author", id) // Filter posts by the author_id
    .neq("id", postId)
    .neq("isPrivate", true)
    .neq("isDraft", true)
    .or("ipfsImages.not.is.null,video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("createdAt", { ascending: false }) // Order posts by creation date, descending
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching other user posts", error)
    throw new Error(error.message)
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }))
}

export async function getPrivatePostsByUser(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for private posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("author", id) // Filter posts by the author_id
    .eq("isPrivate", true)
    // .neq("isDraft", true) for now only user sees private post so they can see it even if it is draft
    .order("createdAt", { ascending: false }) // Order posts by creation date, descending
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching private posts", error)
    throw new Error(error.message)
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }))
}
export async function getPinnedPostsByUser(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for pinned posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  const { data, error } = await client
    .from("post_pins")
    .select(
      `
    posts:posts (
      *,
      createdAt
    )
  `
    ) // ✅ Aliases `posts` for better structure
    .eq("user_id", id)
    .filter("posts.isPrivate", "neq", true)
    .filter("posts.isDraft", "neq", true)
    .or("posts.ipfsImages.not.is.null,posts.video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("createdAt", { ascending: false }) // ✅ Sort correctly
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching pinned posts", error)
    throw new Error(error.message)
  }

  if (!Array.isArray(data)) {
    logError("Unexpected response from Supabase", { data })
    throw new Error("Invalid data format received from Supabase.")
  }

  return (
    data?.map(({ posts }) => ({
      ...(posts as Post), // ✅ Explicitly cast `posts` as `Post`
      author: posts?.author ?? "", // Ensure `author` is always a string
      category: posts?.category ?? null, // Ensure `category` is `string | null`
      ipfsImages: Array.isArray(posts?.ipfsImages)
        ? (posts.ipfsImages as UploadResponse[]) // ✅ Already an array
        : typeof posts?.ipfsImages === "string"
        ? (JSON.parse(posts.ipfsImages) as UploadResponse[]) // ✅ Parse string
        : null, // ❌ Set to null if neither
    })) ?? []
  )
}

export async function getMintedPostsByUser(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for minted posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  // TODO: order should be based on number of mints not createdAt
  const { data, error } = await client
    .from("post_mints")
    .select(
      `
    *,
    posts (
      *,
      createdAt
    )
  `
    )
    .eq("user_id", id)
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching pinned posts", error)
    throw new Error(error.message)
  }

  if (!Array.isArray(data)) {
    logError("Unexpected response from Supabase", { data })
    throw new Error("Invalid data format received from Supabase.")
  }

  const uniquePosts = new Map()

  data.forEach((item) => {
    uniquePosts.set(item.post_id, item)
  })

  let uniquePostItems = Array.from(uniquePosts.values())

  return (
    uniquePostItems?.map(({ posts }) => ({
      ...(posts as Post), // ✅ Explicitly cast `posts` as `Post`
      author: posts?.author ?? "", // Ensure `author` is always a string
      category: posts?.category ?? null, // Ensure `category` is `string | null`
      ipfsImages: Array.isArray(posts?.ipfsImages)
        ? (posts.ipfsImages as UploadResponse[]) // ✅ Already an array
        : typeof posts?.ipfsImages === "string"
        ? (JSON.parse(posts.ipfsImages) as UploadResponse[]) // ✅ Parse string
        : null, // ❌ Set to null if neither
    })) ?? []
  )
}

export async function getIsDraftPostsByUser(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for draft posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("author", id) // Filter posts by the author_id
    .eq("isDraft", true)
    .order("createdAt", { ascending: false }) // Order posts by creation date, descending
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching draft posts", error)
    throw new Error(error.message)
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }))
}
export async function getOtherIsDraftPostsByUser(
  client: Client,
  start = 0,
  postId: number,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for other draft posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("author", id) // Filter posts by the author_id
    .neq("id", postId)
    .eq("isDraft", true)
    .order("createdAt", { ascending: false }) // Order posts by creation date, descending
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching other draft posts", error)
    throw new Error(error.message)
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }))
}

export async function getUserLikedPosts(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT)

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser()
    if (userError) {
      logError("Error fetching user for liked posts", userError)
      throw new Error("Failed to retrieve authenticated user.")
    }
    id = userData?.user?.id
    if (!id) {
      throw new Error("User ID is undefined.")
    }
  }

  const { data, error } = await client
    .from("likes")
    .select("posts(*),created_at")
    .eq("author", id) // Filter posts by the author_id
    .neq("posts.isPrivate", true)
    .neq("posts.isDraft", true)
    .or("posts.ipfsImages.not.is.null,posts.video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("created_at", { ascending: false }) // Order posts by creation date, descending
    .range(range[0], range[1])

  if (error) {
    logError("Supabase error fetching liked posts", error)
    throw new Error(error.message)
  }

  // console.log("Supabase raw data:", data);
  // Extract posts, filtering out any null values
  const posts = data?.flatMap((like) => (like.posts ? [like.posts] : [])) ?? [] // ✅ Ensure posts exist

  return posts.map((post) => ({
    ...post,
    author: post.author ?? "", // ✅ Ensure `author` is always a string
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[])
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  })) as Post[] // ✅ Cast the final array as `Post[]`
}
