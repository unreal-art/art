import { supabase } from "$/supabase/client";
import { Post, UploadResponse } from "$/types/data.types";
import { logError, logWarning } from "@/utils/sentryUtils";

export const searchPostsPaginated = async (
  keyword: string,
  page: number,
  limit = 10
): Promise<Post[]> => {
  if (!keyword?.trim()) return []; // ✅ Prevent empty or whitespace-only searches

  // Calculate pagination bounds, ensuring start is never negative
  const start = Math.max(0, (page - 1) * limit);
  // Calculate end index (inclusive) for the current page
  const end = start + (limit - 1);

  // console.log(`Fetching posts from index ${start} to ${end}`);
  const { data, error } = await supabase
    .from("posts_with_rank") // ✅ Query the view, not "posts"
    .select("*")
    .eq("isPrivate", false) // Filter where isPrivate is false
    .eq("isDraft", false) // Filter where isDraft is false
    .textSearch("prompt", keyword, {
      type: "websearch",
      config: "english",
    })
    .order("rank", { ascending: false }) // ✅ Order by rank
    .order("id", { ascending: false }) // ✅ Ensures stable pagination

    .range(start, end);

  if (error) {
    logError("Supabase post search error", error);
    throw new Error(error.message);
  }

  return data.map((post) => ({
    ...post,
    id: post.id ?? 0, // Ensure id is always a number
    prompt: post.prompt ?? "", // Ensure prompt is always a string
    author: post.author ?? "",
    caption: post.caption ?? "",
    category: post.category ?? "",
    cpu: post.cpu ?? 0,
    createdAt: post.createdAt ?? "",
    device: post.device ?? "",
    rank: post.rank ?? 0,
    seed: post.seed ?? 0,

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
          return null; // ✅ Handle potential parsing errors
        }
      }
      return null;
    })(),
    media_type: (post as any).media_type || null,
    video_data: (post as any).video_data || null,
  }));
};
