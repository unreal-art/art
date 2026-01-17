"use client";
import React from "react";
import {
  MasonryPhotoAlbum,
  RenderImageContext,
  RenderImageProps,
  RenderPhotoContext,
} from "react-photo-album";
import "react-photo-album/masonry.css";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { LIST_LIMIT, MD_BREAKPOINT } from "@/app/libs/constants";
import PhotoOverlay, { ExtendedRenderPhotoContext } from "./photoOverlay";

import Image from "next/image";
import dynamic from "next/dynamic";
import { supabase } from "$/supabase/client";

import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "./InfiniteScroll";
import { formattedPhotosForGallery } from "../formattedPhotos";
import { Post } from "$/types/data.types";
import { useParams, useSearchParams } from "next/navigation";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import useAuthorImage from "@/hooks/useAuthorImage";
import { useUser } from "@/hooks/useUser";
import {
  getOtherIsDraftPostsByUser,
  getOtherPostsByUser,
} from "@/queries/post/getPostsByUser";
import { usePost } from "@/hooks/usePost";
import OptimizedImage from "@/app/components/OptimizedImage";
import { capitalizeFirstAlpha, formatDisplayName } from "@/utils";

// Dynamically import ImageView component to reduce initial bundle size
const ImageView = dynamic(() => import("./imageView"), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 animate-pulse"></div>,
});

// Memoized LazyMedia component to handle both images and videos
const LazyMedia = React.memo(
  ({
    photo,
    width,
    height,
    index,
    alt,
    title,
    sizes,
    shouldPrioritize,
    mediaType,
  }: {
    photo: any;
    width: number;
    height: number;
    index: number;
    alt: string;
    title?: string;
    sizes?: string;
    shouldPrioritize: boolean;
    mediaType?: string | null;
  }) => {
    const imageRef = React.useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(shouldPrioritize);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      // Skip for prioritized images - they load immediately
      if (shouldPrioritize) return;

      let observer: IntersectionObserver;

      // Use requestIdleCallback for non-critical initialization
      const initObserver = () => {
        observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          },
          {
            rootMargin: "200px", // Load images 200px before they enter viewport
            threshold: 0.01, // Trigger when just 1% is visible
          }
        );

        if (imageRef.current) {
          observer.observe(imageRef.current);
        }
      };

      // Use requestIdleCallback or setTimeout as fallback
      if ("requestIdleCallback" in window) {
        // @ts-ignore - TypeScript doesn't have types for this by default
        window.requestIdleCallback(initObserver);
      } else {
        setTimeout(initObserver, 1);
      }

      return () => observer?.disconnect();
    }, [shouldPrioritize]);

    // Extract image name for tracking with safe fallback
    const imageName = useMemo(() => {
      return typeof photo === "object" &&
        "src" in photo &&
        typeof photo.src === "string"
          ? photo.src.split("/").pop()?.split("?")[0] || `gallery-img-${index}`
          : `gallery-img-${index}`;
    }, [photo, index]);

    // Responsive size hints for optimal loading
    const responsiveSizes =
      sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

    return (
      <div
        ref={imageRef}
        style={{
          width: "100%",
          position: "relative",
          aspectRatio: `${width} / ${height}`,
          backgroundColor: "#1a1a1a", // Placeholder color matching skeleton
          borderRadius: "8px",
        }}
      >
        {isVisible ? (
          mediaType === 'VIDEO' ? (
            <div className="relative w-full h-full">
              <video
                src={photo.src || photo}
                className="w-full h-full object-cover rounded-lg"
                muted
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => e.currentTarget.pause()}
              />
              {/* Modern video indicator overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-md">
                    <div className="w-0 h-0 border-l-4 border-l-black border-y-2 border-y-transparent ml-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <OptimizedImage
              fill
              src={hasError ? "/placeholder-image.jpg" : photo}
              alt={alt || "Gallery image"}
              title={title}
              sizes={responsiveSizes}
              loading={shouldPrioritize ? "eager" : "lazy"}
              priority={shouldPrioritize}
              className="rounded-lg"
              placeholder={"blurDataURL" in photo ? "blur" : undefined}
              trackPerformance={process.env.NODE_ENV === "development"}
              imageName={imageName}
              onError={(e) => {
                // Handle image loading failures
                setHasError(true);
                const target = e.target as HTMLImageElement;
                if (target) {
                  target.onerror = null; // Prevent infinite error loop
                  target.src = "/placeholder-image.jpg";
                }
              }}
            />
          )
        ) : (
          // Empty placeholder with correct dimensions
          <div className="w-full h-full rounded-lg bg-primary-13" />
        )}
      </div>
    );
  },
  // Custom comparison function that only triggers re-renders when necessary
  (prevProps, nextProps) => {
    // If the photo ID is the same, don't re-render
    if (
      prevProps.photo &&
      nextProps.photo &&
      'id' in prevProps.photo &&
      'id' in nextProps.photo &&
      prevProps.photo.id === nextProps.photo.id
    ) {
      return true; // props are equal, don't re-render
    }

    // Default comparison for other cases
    return false;
  }
);

// Enhanced media renderer with Intersection Observer for more efficient loading
function renderNextMedia(
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height, index = 0 }: RenderImageContext
) {
  // Validate photo object
  if (!photo || typeof photo !== "object") {
    return <div className="w-full h-64 bg-gray-200">Media data missing</div>;
  }

  // Use priority loading for the first 4 images only (reduced from 8 for faster initial load)
  const shouldPrioritize = index < 4;

  // Extract media type from the photo object
  const mediaType = (photo as any)?.media_type;

  // Only render the LazyMedia component on the client side
  return typeof window === "undefined" ? (
    // Server-side placeholder
    <div
      style={{
        width: "100%",
        position: "relative",
        aspectRatio: `${width} / ${height}`,
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
      }}
    />
  ) : (
    <LazyMedia 
      photo={photo}
      width={width}
      height={height}
      index={index}
      alt={alt}
      title={title}
      sizes={sizes}
      shouldPrioritize={shouldPrioritize}
      mediaType={mediaType}
    />
  );
}

function PhotoGalleryTwo() {
  const [imageIndex, setImageIndex] = useState(-1);
  const [columns, setColumns] = useState<number>(2); // Initialize with default value
  const [error, setError] = useState<string | null>(null);
  // Create a dictionary to track already processed photos by their ID
  const [processedPhotoDict, setProcessedPhotoDict] = useState<Record<string, any>>({});

  const { userId } = useUser();
  const searchParams = useSearchParams();
  const params = useParams();

  // Safely extract and validate ID parameter
  const id = params?.id ? String(params.id) : null;
  const a = searchParams?.get("a") || null;

  // Safely parse postId with validation
  const postId = useMemo(() => {
    if (!id) return null;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
  }, [id]);

  // Fetch post data safely
  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
  } = usePost(postId);

  // Memoize query function to avoid recreating on each render
  const queryFn = useCallback(
    async ({ pageParam = 0 }) => {
      try {
        // Ensure we have the required data before querying
        if (!post?.author) {
          return { data: [], nextCursor: undefined };
        }

        let result: Post[] = [];

        // Always call the appropriate function based on the value of 'a'
        if (a) {
          result = await getOtherIsDraftPostsByUser(
            supabase,
            pageParam,
            postId ?? 0,
            post.author
          );
        } else {
          result = await getOtherPostsByUser(
            supabase,
            pageParam,
            postId ?? 0,
            post.author
          );
        }

        return {
          data: result ?? [],
          nextCursor:
            (result?.length ?? 0) === LIST_LIMIT ? pageParam + 1 : undefined,
        };
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
        return { data: [], nextCursor: undefined };
      }
    },
    [a, postId, post?.author]
  );

  // Use a stable query key that won't change structure between renders
  const queryKey = useMemo(
    () => [
      "other_posts_by_user",
      post?.author || "",
      a ? "drafts" : "public",
      postId,
    ],
    [post?.author, a, postId]
  );

  const {
    isLoading: isQueryLoading,
    isError,
    error: queryError,
    data,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      // Safely access data with null checks
      if (
        !lastPage?.data ||
        !Array.isArray(lastPage.data) ||
        lastPage.data.length === 0
      ) {
        return undefined;
      }
      return lastPage.data.length < LIST_LIMIT
        ? undefined
        : lastPage.nextCursor;
    },
    // Only enable the query when we have the necessary dependencies
    enabled: !!post?.author && postId !== null,
  });

  // Optimize resize handling with useCallback to prevent recreation
  const handleResize = useCallback(() => {
    if (typeof window !== "undefined") {
      setColumns(window.innerWidth < MD_BREAKPOINT ? 2 : 5);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set columns initially
    handleResize();

    // Add resize listener with cleanup
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  const handleImageIndex = useCallback((context: RenderPhotoContext) => {
    if (context && typeof context.index === "number") {
      setImageIndex(context.index);
    }
  }, []);

  // Memoize formatted photos to prevent recalculation on each render
  const photos = useMemo(() => {
    try {
      if (!data?.pages) return [];
      
      // Format photos but preserve references to already processed ones
      const newPhotos = formattedPhotosForGallery(data.pages).map(photo => {
        // If we already processed this photo before, reuse the reference
        return processedPhotoDict[photo.id] || photo;
      });
      
      return newPhotos;
    } catch (err) {
      console.error("Error formatting photos:", err);
      setError(err instanceof Error ? err.message : "Failed to format photos");
      return [];
    }
  }, [data?.pages, processedPhotoDict]);

  // Handle loading state
  const isLoading = isPostLoading || isQueryLoading;
  
  // Update our processed photos dictionary to preserve references
  useEffect(() => {
    // Only update when we have photos and not loading
    if (photos.length > 0 && !isLoading) {
      // Build new dictionary of processed photos
      const newDict = { ...processedPhotoDict };
      let dictChanged = false;
      
      // Add any new photos to our dictionary
      photos.forEach(photo => {
        if (!newDict[photo.id]) {
          newDict[photo.id] = photo;
          dictChanged = true;
        }
      });
      
      // Update the dictionary if changed
      if (dictChanged) {
        setProcessedPhotoDict(newDict);
      }
    }
  }, [photos, isLoading, processedPhotoDict]);

  // Handle all possible error states
  const errorMessage =
    error ||
    (isError && queryError
      ? typeof queryError === "object" &&
        queryError !== null &&
        "message" in queryError
        ? String(queryError.message)
        : "An error occurred"
      : null) ||
    (postError ? String(postError) : null);

  // Handle error state after all hooks run
  if (errorMessage) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        <p className="font-medium">Error:</p>
        <p>{errorMessage}</p>
      </div>
    );
  }

  // Handle empty state after all hooks run
  if (
    !isLoading &&
    (!data ||
      !data.pages ||
      data.pages.length === 0 ||
      (data.pages[0] &&
        (!data.pages[0].data || data.pages[0].data.length === 0)))
  ) {
    return <p className="text-center p-4">No images found.</p>;
  }

  // No need for column check since we initialize with default value

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="masonry-container" style={{ width: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: "10px",
            }}
          >
            {Array(15)
              .fill(null)
              .map((_, index) => (
                <div
                  key={index}
                  className="w-full h-48 bg-primary-13 rounded-lg animate-pulse"
                  style={{
                    backgroundColor: "#1a1a1a",
                  }}
                />
              ))}
          </div>
        </div>
      ) : (
        <InfiniteScroll
          isLoadingInitial={isLoading}
          isLoadingMore={isFetchingNextPage}
          loadMore={() => hasNextPage && fetchNextPage()}
          hasNextPage={!!hasNextPage}
        >
          <MasonryPhotoAlbum
            photos={photos}
            columns={columns}
            spacing={10}
            render={{
              extras: (_, context) => (
                <PhotoWithAuthor
                  context={context as ExtendedRenderPhotoContext}
                  handleImageIndex={handleImageIndex}
                />
              ),
              image: renderNextMedia,
            }}
          />
        </InfiniteScroll>
      )}

      {photos.length > 0 && imageIndex > -1 && imageIndex < photos.length && (
        <ImageView photo={photos[imageIndex]} setImageIndex={setImageIndex} />
      )}
    </div>
  );
}

// Memoize the PhotoWithAuthor component to prevent unnecessary rerenders
const PhotoWithAuthor = memo(function PhotoWithAuthor({
  context,
  handleImageIndex,
}: {
  context: ExtendedRenderPhotoContext;
  handleImageIndex: (context: RenderPhotoContext) => void;
}) {
  // Default to empty string if author is not available
  const authorId = context?.photo?.author || "";

  const { data: userName, isLoading: isUserNameLoading } =
    useAuthorUsername(authorId);
  const { data: image, isLoading: isImageLoading } = useAuthorImage(authorId);

  // Only render content if we have context
  if (!context) return null;

  return (
    <PhotoOverlay
      setImageIndex={() => handleImageIndex(context)}
      context={context}
    >
      <div className="hidden md:flex absolute  items-center gap-1 bottom-2 left-2">
        {!isUserNameLoading && !isImageLoading && userName ? (
          <>
            <div className="rounded-full">
              {image ? (
                <OptimizedImage
                  className="rounded-full drop-shadow-lg"
                  src={image}
                  width={24}
                  height={24}
                  alt={`${userName}'s profile picture`}
                  trackPerformance={true}
                  imageName={`profile-${authorId}`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target) {
                      target.onerror = null;
                      target.src = "/default-avatar.jpg";
                    }
                  }}
                  username={userName || ""}
                  isAvatar={true}
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full" /> // Fallback avatar
              )}
            </div>
            <p className="font-semibold text-sm drop-shadow-lg">
              {typeof userName === "string"
                ? formatDisplayName(userName)
                : "Unknown"}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse" />
            <div className="w-16 h-4 bg-gray-300 rounded animate-pulse" />
          </div>
        )}
      </div>
    </PhotoOverlay>
  );
});

export default memo(PhotoGalleryTwo);
