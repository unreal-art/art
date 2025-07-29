import { Client } from "$/supabase/client";
import { Post, UploadResponse } from "$/types/data.types";
import { getRange } from "@/utils";
import { LIST_LIMIT } from "@/app/libs/constants";
import { logError } from "@/utils/sentryUtils";

export async function getPosts(client: Client, start = 0): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT);

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("isPrivate", false) // Filter where isPrivate is false
    .eq("isDraft", false) // Filter where isDraft is false
    .or("ipfsImages.not.is.null,video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("createdAt", { ascending: false })
    .range(range[0], range[1]);

  if (error) {
    logError("Supabase error fetching posts", error);
    throw new Error(error.message);
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }));
}

export async function getTopPosts(client: Client, start = 0): Promise<Post[]> {
  const range = getRange(start, 20);

  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("isPrivate", false) // Filter where isPrivate is false
    .eq("isDraft", false) // Filter where isDraft is false
    .gt("like_count", 0)
    .or("ipfsImages.not.is.null,video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("like_count", { ascending: false })
    .range(range[0], range[1]);

  if (error) {
    console.error("Supabase error:", error.message);
    throw new Error(error.message);
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }));
}
export async function getTopMintedPosts(
  client: Client,
  start = 0
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT);
  console.log("here called");
  const { data, error } = await client
    .from("posts_with_mint_count") // Use the view instead
    .select("*")
    .eq("isPrivate", false)
    .eq("isDraft", false)
    .order("mint_count", { ascending: false })
    // .order("like_count", { ascending: false })
    .range(range[0], range[1]);

  if (error) {
    logError("Supabase error fetching top posts", error);
    throw new Error(error.message);
  }

  return data.map((post) => ({
    ...post,
    author: post.author || "", // Ensure author is always a string
    createdAt: post.createdAt || "", // Ensure createdAt is always a string
    id: post.id ?? 0, // Ensure id is always a number
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[])
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[])
      : null,
    media_type: (post as any).media_type || null, // Handle potentially missing field
    video_data: (post as any).video_data || null, // Handle potentially missing field
  }));
}

export async function getFollowingPosts(
  client: Client,
  start = 0,
  id?: string
): Promise<Post[]> {
  const range = getRange(start, LIST_LIMIT);

  // If no ID is provided, retrieve the authenticated user's ID
  if (!id) {
    const { error: userError, data: userData } = await client.auth.getUser();
    if (userError) {
      logError("Error fetching user for following posts", userError);
      throw new Error("Failed to retrieve authenticated user.");
    }
    id = userData?.user?.id;
    if (!id) {
      throw new Error("User ID is undefined.");
    }
  }

  // Fetch followee IDs for the given user
  const { data: followings, error: followingsError } = await client
    .from("follows")
    .select("followee_id")
    .eq("follower_id", id);

  if (followingsError) {
    logError("Error fetching user followings", followingsError);
    throw followingsError;
  }

  const followeeIds = followings.map((following) => following.followee_id);

  if (followeeIds.length === 0) {
    return []; // If the user is not following anyone, return an empty array
  }

  const { data, error } = await client
    .from("posts")
    .select("*")
    .in("author", followeeIds as string[])
    .eq("isPrivate", false) // Filter where isPrivate is false
    .eq("isDraft", false) // Filter where isDraft is false
    .or("ipfsImages.not.is.null,video_data.not.is.null") // Must have either ipfsImages or video_data
    .order("createdAt", { ascending: false })
    .range(range[0], range[1]);

  if (error) {
    logError("Supabase error fetching following posts", error);
    throw new Error(error.message);
  }

  // console.log("Supabase raw data:", data);

  return data.map((post) => ({
    ...post,
    ipfsImages: Array.isArray(post.ipfsImages)
      ? (post.ipfsImages as UploadResponse[]) // ✅ If already an array, cast it
      : typeof post.ipfsImages === "string"
      ? (JSON.parse(post.ipfsImages) as UploadResponse[]) // ✅ Parse string to UploadResponse[]
      : null, // ❌ Set to null if neither
  }));
}
