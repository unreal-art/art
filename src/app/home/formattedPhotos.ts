import { Page, Post } from "$/types/data.types";
import { isHighQualityImage } from "@/utils";
import type { Photo } from "react-photo-album";
import appConfig from "@/config";
import fallbackImage from "@/assets/images/fallback.png";

export interface ExtendedPhoto extends Photo {
  prompt?: string;
  author?: string;
  category?: string;
  cpu?: number;
  createdAt?: string;
  device?: string;
  isDraft?: boolean;
  isPinned?: boolean;
  isPrivate?: boolean;
  likeCount?: number;
  seed?: number;
  id: string;
  caption?: string;
  media_type?: string | null;
}

const breakpoints = [1080, 640, 384, 256, 128, 96, 64, 48];

// Helper function to get media URL for both images and videos
export const getMediaUrl = (post: Post): string => {
  if (post.media_type === 'VIDEO' && post.video_data) {
    // Handle video data
    const videoData = Array.isArray(post.video_data) ? post.video_data[0] : post.video_data;
    if (videoData && typeof videoData === 'object' && 'hash' in videoData) {
      // For videos, the hash field contains the direct URL
      const videoUrl = (videoData as any).hash;
      // Check if it's already a full URL
      if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
        return videoUrl;
      }
      // Fallback to getImage if it's actually a hash
      if ('fileNames' in videoData && (videoData as any).fileNames?.[0]) {
        return getImage(videoUrl, (videoData as any).fileNames[0], post.author);
      }
    }
    // Fallback for different video data structures
    if (videoData && typeof videoData === 'object') {
      return (videoData as any)?.url || (videoData as any)?.src || (videoData as any)?.hash || "";
    }
    return "";
  } else {
    // Handle image data (existing behavior)
    const image = post.ipfsImages?.[0];
    if (!image || !image.hash || !image.fileNames?.[0]) return "";
    return getImage(image.hash, image.fileNames[0], post.author);
  }
};

// Function to fetch the image
export const getImage = (
  cidOrUrl: string | undefined,
  fileName: string,
  author: string,
): string => {
  try {
    if (!cidOrUrl) {
      //console.warn("getImage called with an undefined or empty cidOrUrl");
      return typeof fallbackImage === "string"
        ? fallbackImage
        : fallbackImage.src; // Handle missing value gracefully
    }

    const isDev = appConfig.environment.isDevelopment;
    const isLighthouseCID = !cidOrUrl?.startsWith("http"); // Use optional chaining

    let imageOptions = "";
    if (isLighthouseCID && isHighQualityImage(fileName)) {
      imageOptions += "?h=300&w=300";
    }

    // In dev mode, use R2.dev for Cloudflare images, but keep Lighthouse CID-based URLs
    if (isDev) {
      return isLighthouseCID
        ? appConfig.services.lighthouse.gateway +
            cidOrUrl +
            "/" +
            fileName +
            imageOptions
        : `${appConfig.services.cloudflare.url}/${author}/${fileName}`;
    }

    // In production, return the stored URL as-is
    return isLighthouseCID
      ? appConfig.services.lighthouse.gateway +
          cidOrUrl +
          "/" +
          fileName +
          imageOptions
      : `${appConfig.services.cloudflare.url}/${author}/${fileName}`; //cidOrUrl; // fetch from Cloudflare TODO: get direct from Cloudflare
  } catch (error) {
    console.error("Error fetching image:", error);
    return typeof fallbackImage === "string"
      ? fallbackImage
      : fallbackImage.src; // Fallback if there's an error
  }
};
export const formattedPhotosForGallery = (pages: Page[]): ExtendedPhoto[] => {
  return pages
    .flatMap((page) =>
      page.data.map((post: Post, index) => {
        // Check if post has valid media (either images or videos)
        const hasValidImage = post.ipfsImages?.[0]?.hash && post.ipfsImages?.[0]?.fileNames?.[0];
        const hasValidVideo = post.media_type === 'VIDEO' && post.video_data;
        
        if (!hasValidImage && !hasValidVideo) return null;
        
        // Get media URL for both images and videos
        const mediaUrl = getMediaUrl(post);

        // More dynamic width variations for visual interest
        const baseWidths = [300, 320, 340, 360, 380, 400];
        const baseWidth = baseWidths[post.id % baseWidths.length];

        // Enhanced aspect ratios with more portrait emphasis for mobile
        const aspectRatioSets = [
          // More tall portrait ratios for mobile scrolling
          [0.45, 0.5, 0.55, 0.6, 0.65], // Extra tall portraits
          [0.6, 0.65, 0.7, 0.75, 0.8], // Tall portraits
          [0.7, 0.75, 0.8, 0.85, 0.9], // Medium-tall portraits
          [0.85, 0.9, 0.95], // Medium portraits

          // Square ratios (fewer for mobile)
          [1, 1], // Perfect squares (less weighted)

          // Landscape ratios (reduced for mobile)
          [1.1, 1.15, 1.2], // Slightly wide
          [1.25, 1.3], // Medium landscape (reduced)

          // Extra variety with portrait bias
          [0.45, 0.7, 0.85, 1.1, 0.6], // Mixed ratios with portrait bias
        ];

        // Use a combination of post ID and index for more randomness
        const setIndex = (post.id + index) % aspectRatioSets.length;
        const ratioSet = aspectRatioSets[setIndex];
        const aspectRatio = ratioSet[(post.id * 3 + index) % ratioSet.length];

        // Calculate height with more dramatic variations
        let calculatedHeight = Math.round(baseWidth / aspectRatio);

        // Responsive height constraints - increased minimums to prevent UI clashing
        let minHeight, maxHeight;

        if (aspectRatio < 0.6) {
          // Extra tall portraits - ensure good spacing from UI elements
          minHeight = 450; // Increased from 420
          maxHeight = 520; // Increased from 500
        } else if (aspectRatio < 0.8) {
          // Portrait images - increased minimum for mobile UI clearance
          minHeight = 400; // Increased from 360
          maxHeight = 480; // Increased from 450
        } else if (aspectRatio > 1.2) {
          // Landscape images - maintain reasonable minimum
          minHeight = 300; // Increased from 240
          maxHeight = 380; // Increased from 320
        } else {
          // Square-ish images - increased minimum for better mobile experience
          minHeight = 380; // Increased from 320
          maxHeight = 450; // Increased from 400
        }

        // Apply constraints
        if (calculatedHeight < minHeight) calculatedHeight = minHeight;
        if (calculatedHeight > maxHeight) calculatedHeight = maxHeight;

        // Subtle organic variations - minimal distortion
        const organicVariations = [
          1.01, 1.03, 1.05, 1.0, 1.02, 1.04, 0.99, 1.03, 1.01, 1.05, 0.98, 1.02,
          1.04, 1.01, 1.05, 0.97, 1.02, 1.0, 1.04, 0.99, 1.05, 1.02, 0.98, 1.03,
        ];

        const variationIndex = (post.id + index * 2) % organicVariations.length;
        const variation = organicVariations[variationIndex];
        const finalHeight = Math.round(calculatedHeight * variation);

        // Higher absolute minimum for mobile - ensure good visibility
        const constrainedHeight = Math.max(finalHeight, 250);

        // Calculate final aspect ratio
        const actualAspectRatio = baseWidth / constrainedHeight;

        return {
          id: post.id.toString(),
          src: mediaUrl,
          key: post.id.toString(),
          alt: post.prompt,
          width: baseWidth,
          height: constrainedHeight,
          srcSet: breakpoints.map((breakpoint) => ({
            src: mediaUrl,
            width: breakpoint,
            height: Math.round(breakpoint / actualAspectRatio),
          })),
          prompt: post.prompt,
          author: post.author,
          category: post.category,
          cpu: post.cpu,
          createdAt: post.createdAt,
          device: post.device,
          isDraft: post.isDraft,
          isPinned: post.isPinned,
          isPrivate: post.isPrivate,
          caption: post.caption,
          seed: post.seed,
          media_type: post.media_type,
        } as ExtendedPhoto;
      }),
    )
    .filter(Boolean) as ExtendedPhoto[];
};

export const formattedPhotosForGrid = (pages: Page[]): ExtendedPhoto[] => {
  return pages
    .flatMap((page) =>
      page.data.map((post: Post) => {
        const image = post.ipfsImages?.[0];
        if (!image || !image.hash || !image.fileNames?.[0]) return null;

        const assetHash = image.hash;
        const fileName = image.fileNames[0];

        // Generate the image URL just once
        const imageUrl = getImage(assetHash, fileName, post.author);

        return {
          id: post.id.toString(),
          src: imageUrl,
          key: post.id.toString(),
          alt: post.prompt,
          width: 1080,
          height: 1080, // Adjust based on actual aspect ratio
          srcSet: breakpoints.map((breakpoint) => ({
            src: imageUrl, // Reuse the same URL instead of regenerating
            width: breakpoint,
            height: breakpoint, // Maintain aspect ratio
          })),
          prompt: post.prompt,
          author: post.author,
          category: post.category,
          cpu: post.cpu,
          createdAt: post.createdAt,
          device: post.device,
          isDraft: post.isDraft,
          isPinned: post.isPinned,
          isPrivate: post.isPrivate,
          caption: post.caption,
          seed: post.seed,
        } as ExtendedPhoto;
      }),
    )
    .filter(Boolean) as ExtendedPhoto[];
};

export const formattedPhotos = (pages: Page[]): ExtendedPhoto[] => {
  return pages
    .flatMap((page) =>
      page.data.map((post: Post) => {
        const image = post.ipfsImages?.[0]; // Assuming only one image per post

        if (!image || !image.hash || !image.fileNames?.[0]) return null;

        const assetHash = image.hash;
        const fileName = image.fileNames[0];

        // Generate the image URL just once
        const imageUrl = getImage(assetHash, fileName, post.author);

        return {
          id: post.id.toString(),
          src: imageUrl,
          key: post.id.toString(),
          alt: post.prompt,
          width: 1080,
          height: 720, // Adjust based on actual aspect ratio
          srcSet: breakpoints.map((breakpoint) => ({
            src: imageUrl, // Reuse the same URL instead of regenerating
            width: breakpoint,
            height: Math.round((720 / 1080) * breakpoint), // Maintain aspect ratio
          })),
          prompt: post.prompt,
          author: post.author,
          category: post.category,
          cpu: post.cpu,
          createdAt: post.createdAt,
          device: post.device,
          isDraft: post.isDraft,
          isPinned: post.isPinned,
          isPrivate: post.isPrivate,
          caption: post.caption,
          seed: post.seed,
        } as ExtendedPhoto;
      }),
    )
    .filter(Boolean) as ExtendedPhoto[];
};
