"use client";
import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { ErrorBoundary } from "@/app/components/errorBoundary";
import OptimizedImage from "@/app/components/OptimizedImage";
import NoItemFound from "./NoItemFound";
import InfiniteScroll from "../../components/InfiniteScroll";
import dynamic from "next/dynamic";
import PhotoOverlay, {
  ExtendedRenderPhotoContext,
} from "../../components/photoOverlay";
import { TabText } from "@/stores/creationAndProfileStore";
import { Post } from "$/types/data.types";
import { getImage } from "../../formattedPhotos";

// Constants for breakpoints and grid sizing
const BREAKPOINTS = {
  FOUR_XL: 2000,
  TWO_XL: 1536,
  XL: 1280,
  LG: 1024,
  MD: 768,
  SM: 640,
} as const;

const GRID_SIZES = {
  TWO_XL: 380,
  LG: 320,
  MD: 320,
  SM: 300,
} as const;

// Props interface for the PhotoGridTwo component
interface TabProps {
  title: TabText;
  content: string;
  subContent: string;
  data?: any;
  isLoading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}


interface TransformedPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string | null;
  prompt: string;
  createdAt: string;
  author: string;
  media_type?: string | null;
}

// Dynamically import ImageView with no SSR since it's only needed on client
const ImageView = dynamic(() => import("../../components/imageView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="animate-pulse bg-primary-13 rounded-lg w-full h-full"></div>
    </div>
  ),
});

export default function PhotoGridTwo({
  title,
  content,
  subContent,
  data,
  isLoading = false,
  hasNextPage = false,
  fetchNextPage = () => {},
  isFetchingNextPage = false,
}: TabProps): ReactElement {
  const [photos, setPhotos] = useState<TransformedPhoto[]>([]);
  const [stableLoading, setStableLoading] = useState(true); // Stable loading state to prevent flashing
  const [imageIndex, setImageIndex] = useState(-1);
  const [size, setSize] = useState<number>(GRID_SIZES.LG);

  // Transform and stabilize data updates to prevent flashing
  useEffect(() => {
    // During transitions, we keep the previous data and just overlay loading indicators
    // Only reset data when we have a real loading state (not a transition)
    if (isLoading && !photos.length) {
      setStableLoading(true);
    }

    // If we have data, process it
    if (data?.pages) {
      const allPosts = data.pages.flatMap((page: any) => page.data || []);

      // Transform the posts into photo format - handle both images and videos
      const newTransformedPosts = allPosts
        .filter((post: Post) => {
          // Include posts with images (IMAGE media type)
          if (post.media_type === 'IMAGE' || !post.media_type) {
            const image = post.ipfsImages?.[0];
            return image?.hash && image?.fileNames?.[0];
          }
          // Include posts with videos (VIDEO media type)
          if (post.media_type === 'VIDEO') {
            return post.video_data;
          }
          return false;
        })
        .map((post: Post): TransformedPhoto => {
          let mediaUrl: string = ""; // Initialize with default value
          
          // Handle video media type
          if (post.media_type === 'VIDEO' && post.video_data) {
            // Extract video URL from video_data
            const videoData = Array.isArray(post.video_data) ? post.video_data[0] : post.video_data;
            if (videoData && typeof videoData === 'object' && 'hash' in videoData) {
              // For videos, the hash field contains the direct URL
              const videoUrl = (videoData as any).hash;
              // Check if it's already a full URL
              if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
                mediaUrl = videoUrl;
              } else {
                // Fallback to getImage if it's actually a hash
                if ('fileNames' in videoData && (videoData as any).fileNames?.[0]) {
                  mediaUrl = getImage(videoUrl, (videoData as any).fileNames[0], post.author);
                } else {
                  mediaUrl = "";
                }
              }
            } else {
              // Fallback for different video data structures
              mediaUrl = (videoData as any)?.url || (videoData as any)?.src || (videoData as any)?.hash || "";
            }
          } else {
            // Handle image media type (default behavior)
            const image = post.ipfsImages?.[0];
            mediaUrl = getImage(
              image!.hash,
              image!.fileNames?.[0],
              post.author
            );
          }

          return {
            id: post.id.toString(),
            src: mediaUrl,
            width: size,
            height: size,
            alt: post.caption || post.prompt || "",
            caption: post.caption,
            prompt: post.prompt || "",
            createdAt: post.createdAt,
            author: post.author,
            media_type: post.media_type,
          };
        });


      // Turn off loading only when we have posts or we're sure we're done loading
      if (newTransformedPosts.length > 0 || !isLoading) {
        setStableLoading(false);
        setPhotos(newTransformedPosts);
      }
    } else if (!isLoading && data) {
      // Only turn off loading and show empty state when we're completely done loading
      // AND we have a data object (even if it has no items)
      setStableLoading(false);
      setPhotos([]);
    }
  }, [data, isLoading, size]);

  const handleImageIndex = useCallback(
    (context: ExtendedRenderPhotoContext) => {
      setImageIndex(context.index);
    },
    []
  );

  const loadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= BREAKPOINTS.TWO_XL) {
        setSize(GRID_SIZES.TWO_XL);
      } else if (width >= BREAKPOINTS.LG) {
        setSize(GRID_SIZES.LG);
      } else if (width >= BREAKPOINTS.MD) {
        setSize(GRID_SIZES.MD);
      } else {
        setSize(GRID_SIZES.SM);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const renderPhoto = useCallback(
    (context: ExtendedRenderPhotoContext) => {
      const { photo } = context;
      const width = size;
      const height = size;

      return (
        <ErrorBoundary
          fallback={
            <div
              className="relative bg-primary-13 rounded-lg overflow-hidden"
              style={{ width, height }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-primary-3 text-sm">Failed to load image</p>
              </div>
            </div>
          }
        >
          <div
            className="relative bg-primary-13 rounded-lg overflow-hidden"
            style={{ width, height }}
          >
            {photo.media_type === 'VIDEO' ? (
              <div className="relative w-full h-full">
                <video
                  src={photo.src}
                  width={width}
                  height={height}
                  className="object-cover w-full h-full transition-opacity duration-300"
                  style={{ opacity: 1, position: "relative" }}
                  controls={false}
                  controlsList="nodownload"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
                {/* Video indicator overlay - positioned in bottom right corner */}
                <div className="absolute bottom-2 right-2">
                  <div className="w-6 h-6 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent ml-0.5"></div>
                  </div>
                </div>
              </div>
            ) : (
              <OptimizedImage
                src={photo.src}
                alt={photo.alt || ""}
                width={width}
                height={height}
                className="object-cover w-full h-full transition-opacity duration-300"
                style={{ opacity: 1, position: "relative" }} // Removed z-index to prevent conflicts
                imageName={`creation-${photo.id}`}
                trackPerformance={true}
                priority={parseInt(photo.id) < 4} // Prioritize first few images
              />
            )}
            {/* Caption overlay with lower z-index to not interfere with PhotoOverlay elements */}
            <div
              className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent"
              style={{ opacity: 1 }}
            >
              <p className="text-white text-xs truncate md:hidden">
                {photo.caption || photo.prompt}
              </p>
            </div>
          </div>
        </ErrorBoundary>
      );
    },
    [size]
  );

  // Only show empty state when we're not loading and have no photos
  // We've already confirmed we have data object but it's empty
  if (!photos.length && !isLoading && !stableLoading && data) {
    return (
      <NoItemFound title={title} content={content} subContent={subContent} />
    );
  }

  // Now let InfiniteScroll handle the loading states
  return (
    <>
      <InfiniteScroll
        isLoadingInitial={isLoading || stableLoading}
        isLoadingMore={isFetchingNextPage}
        loadMore={loadMore}
        hasNextPage={hasNextPage}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 place-items-center">
          {photos.map((photo: TransformedPhoto, index: number) => {
            const context = {
              index,
              photo,
              width: photo.width,
              height: photo.height,
            };

            return (
              <div
                key={photo.id}
                style={{ width: size, height: size }}
                className="relative grid-cols-1"
              >
                <PhotoOverlay
                  setImageIndex={() =>
                    handleImageIndex(context as ExtendedRenderPhotoContext)
                  }
                  context={context as ExtendedRenderPhotoContext}
                  photo={renderPhoto(context as ExtendedRenderPhotoContext)}
                  section="photoGridTwo"
                >
                  {null}
                </PhotoOverlay>
              </div>
            );
          })}
        </div>
      </InfiniteScroll>

      {imageIndex > -1 && (
        <ImageView photo={photos[imageIndex]} setImageIndex={setImageIndex} />
      )}
    </>
  );
}
