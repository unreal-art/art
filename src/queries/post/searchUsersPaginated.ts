import { supabase } from "$/supabase/client";
import { Post, UploadResponse } from "$/types/data.types";
import { logError, logWarning } from "@/utils/sentryUtils";

export type ProfileWithPosts = {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  createdAt: string;
  posts: Post[]; // Up to 10 posts per user
};

export const searchUsersPaginated = async (
  keyword: string,
  page: number,
  limit = 10
): Promise<ProfileWithPosts[]> => {
  if (!keyword?.trim()) return []; // Prevent empty searches

  const start = Math.max(0, (page - 1) * limit);
  const end = start + (limit - 1);

  // const { data, error } = await supabase
  //   .from("profiles")
  //   .select(`*, posts:posts(*)`) // Select everything from profiles and its posts
  //   .textSearch("full_name", keyword, {
  //     type: "websearch",
  //     config: "english",
  //   })
  //   .order("createdAt", { ascending: false }) // Ensure correct sorting
  //   .range(start, end);
  //
  const { data, error } = await supabase
    .from("profiles")
    .select(`*, posts:posts(*)`)
    .textSearch("search_vector", keyword, {
      type: "websearch",
      config: "english",
    })
    .order("createdAt", { ascending: false })
    .range(start, end);

  if (error) {
    logError("Supabase user search error", error);
    throw new Error(error.message);
  }
  // Transform data to match `ProfileWithPosts` type
  return data.map((profile) => ({
    id: profile.id,
    full_name: profile.full_name || "", // Ensure non-null string
    username: profile.display_name || profile.full_name || "",
    avatar_url: profile.avatar_url,
    createdAt: profile.createdAt ?? "",
    posts: Array.isArray(profile.posts)
      ? profile.posts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort posts by createdAt in descending order (most recent first)
          .slice(0, 10)
          .map((post) => ({
            ...post, // Spread all post fields dynamically
            createdAt: post.createdAt ?? "",
            ipfsImages: (() => {
              if (Array.isArray(post.ipfsImages))
                return post.ipfsImages as UploadResponse[];
              if (typeof post.ipfsImages === "string") {
                try {
                  return JSON.parse(post.ipfsImages) as UploadResponse[];
                } catch {
                  logWarning("Failed to parse ipfsImages", {
                    ipfsImages: post.ipfsImages,
                  });
                  return null;
                }
              }
              return null;
            })(),
          }))
      : [],
  }));
};
