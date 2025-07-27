"use client";
import React from "react";
import {
  ColumnsPhotoAlbum,
  MasonryPhotoAlbum,
  RenderImageContext,
  RenderImageProps,
  RenderPhotoContext,
  RowsPhotoAlbum,
} from "react-photo-album";
import "react-photo-album/masonry.css";
import { useEffect, useState, useMemo } from "react";
import { LIST_LIMIT, MD_BREAKPOINT } from "@/app/libs/constants";
import PhotoOverlay, { ExtendedRenderPhotoContext } from "./photoOverlay";
import ImageView from "./imageView";
import { supabase } from "$/supabase/client";
import {
  getFollowingPosts,
  getPosts,
  getTopMintedPosts,
  getTopPosts,
} from "@/queries/post/getPosts";
import { useInfiniteQuery } from "@tanstack/react-query";
import InfiniteScroll from "./InfiniteScroll";
import { formattedPhotosForGallery } from "../formattedPhotos";
import { Post } from "$/types/data.types";
import { useSearchParams } from "next/navigation";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import useAuthorImage from "@/hooks/useAuthorImage";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { useGalleryStore } from "@/stores/galleryStore";
import OptimizedImage from "@/app/components/OptimizedImage";
import { capitalizeFirstAlpha, formatDisplayName } from "@/utils";
import { Color } from "three/src/Three.Core.js";

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
    const [isVisible, setIsVisible] = React.useState(shouldPrioritize);

    React.useEffect(() => {
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
          },
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

    // Extract image name for tracking
    const imageName = useMemo(() => {
      return typeof photo === "object" && photo !== null && "src" in photo
        ? String(photo.src).split("/").pop()?.split("?")[0] ||
            `gallery-img-${index}`
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
              {/* Video indicator overlay - positioned in bottom right corner */}
              <div className="absolute bottom-2 right-2">
                <div className="w-6 h-6 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent ml-0.5"></div>
                </div>
              </div>
            </div>
          ) : (
            <OptimizedImage
              fill
              src={photo}
              alt={alt || "Gallery image"}
              title={title}
              sizes={responsiveSizes}
              className="rounded-lg"
              loading={shouldPrioritize ? "eager" : "lazy"}
              priority={shouldPrioritize}
              placeholder={"blurDataURL" in photo ? "blur" : undefined}
              trackPerformance={process.env.NODE_ENV === "development"}
              imageName={imageName}
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
      "id" in prevProps.photo &&
      "id" in nextProps.photo &&
      prevProps.photo.id === nextProps.photo.id
    ) {
      return true; // props are equal, don't re-render
    }

    // Default comparison for other cases
    return false;
  },
);

// Enhanced media renderer with Intersection Observer for more efficient loading
function renderNextMedia(
  { alt = "", title, sizes }: RenderImageProps,
  { photo, width, height, index = 0 }: RenderImageContext,
) {
  // Use priority loading for the first 4 items (eagerly loaded)
  // Reduced from 8 to 4 to improve initial load time
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

export default function PhotoGallery() {
  const [imageIndex, setImageIndex] = useState(-1);
  // Always initialize with a stable value to prevent layout shifts
  const [columns, setColumns] = useState<number>(2);
  const [isBrowser, setIsBrowser] = useState(false);
  // Keep a reference to the previous photos to prevent layout jumping during tab changes
  const [prevPhotos, setPrevPhotos] = useState<any[]>([]);
  // Create a dictionary to track already processed photos by their ID
  const [processedPhotoDict, setProcessedPhotoDict] = useState<
    Record<string, any>
  >({});

  // Use Zustand store for tab state
  const { activeTab, initFromUrl } = useGalleryStore();

  // Sync with URL on initial load (for direct URL access)
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsBrowser(true);

    const urlParam = searchParams?.get("s");
    if (initFromUrl && urlParam) {
      initFromUrl(urlParam);
    }

    // Set initial columns based on window width
    if (typeof window !== "undefined") {
      const columnCount = window.innerWidth < MD_BREAKPOINT ? 2 : 5;
      setColumns(columnCount);
    }
  }, [searchParams, initFromUrl]);

  const {
    isLoading,
    isError,
    error,
    data,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", activeTab?.toLowerCase() || "featured_mints"],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        let result: Post[] = [];
        // Use activeTab from Zustand instead of URL param
        if (activeTab === "FOLLOWING") {
          result = await getFollowingPosts(supabase, pageParam);
        } else if (activeTab === "EXPLORE") {
          result = await getPosts(supabase, pageParam);
        } else if (activeTab === "FEED") {
          result = await getTopPosts(supabase, pageParam);
        } else {
          // Default to top posts
          result = await getTopMintedPosts(supabase, pageParam);
        }

        return {
          data: result ?? [],
          nextCursor: result.length === LIST_LIMIT ? pageParam + 1 : undefined,
        };
      } catch (err) {
        console.error("Error fetching posts:", err);
        return { data: [], nextCursor: undefined };
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Column calculation effect with debouncing for stability
  useEffect(() => {
    if (typeof window === "undefined") return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Calculate columns based on current window width
      const newColumnCount = window.innerWidth < MD_BREAKPOINT ? 2 : 5;

      // Clear any existing timer to debounce the resize
      clearTimeout(resizeTimer);

      // Debounce column updates to prevent rapid changes
      resizeTimer = setTimeout(() => {
        setColumns((prevColumns) => {
          // Only update if changed to prevent unnecessary renders
          return prevColumns !== newColumnCount ? newColumnCount : prevColumns;
        });
      }, 50); // 50ms debounce
    };

    try {
      // Use ResizeObserver for better performance
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(handleResize);
      });

      resizeObserver.observe(document.body);
      handleResize(); // Initial calculation

      return () => {
        clearTimeout(resizeTimer);
        resizeObserver.disconnect();
      };
    } catch (err) {
      // Fallback for browsers without ResizeObserver
      window.addEventListener("resize", handleResize);
      handleResize(); // Initial calculation

      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const handleImageIndex = (context: RenderPhotoContext) => {
    setImageIndex(context.index);
  };

  if (isError) {
    return (
      <p className="wrapper">
        {"message" in error ? error.message : String(error)}
      </p>
    );
  }

  // Only show no data message when we have data object but it's empty
  if (
    !isLoading &&
    (!data || data.pages.length === 0 || data.pages[0].data.length === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[200px]">
        <p className="text-center text-lg text-primary-6">No posts found</p>
        <p className="text-center text-sm text-primary-7 mt-2">
          {activeTab === "FOLLOWING"
            ? "Follow some creators to see their posts here"
            : "Be the first to share something amazing"}
        </p>
      </div>
    );
  }

  // Use memo to format photos only when necessary
  const currentPhotos = useMemo(() => {
    if (!data) return [];

    // Format only new photos and reuse already processed ones
    const newPhotos = formattedPhotosForGallery(data.pages).map((photo) => {
      // If we already processed this photo before, reuse the existing reference
      return processedPhotoDict[photo.id] || photo;
    });

    return newPhotos;
  }, [data, processedPhotoDict]);

  // Update our processed photos dictionary and previous photos reference
  useEffect(() => {
    // Only update when not loading and we have photos
    if (!isLoading && currentPhotos.length > 0) {
      // Build new dictionary of processed photos
      const newDict = { ...processedPhotoDict };
      let dictChanged = false;

      // Add any new photos to our dictionary
      currentPhotos.forEach((photo) => {
        if (!newDict[photo.id]) {
          newDict[photo.id] = photo;
          dictChanged = true;
        }
      });

      // Update the dictionary if changed
      if (dictChanged) {
        setProcessedPhotoDict(newDict);
      }

      // Compare to avoid unnecessary state updates for previous photos
      if (prevPhotos.length !== currentPhotos.length) {
        setPrevPhotos(currentPhotos);
      }
    }
  }, [isLoading, currentPhotos, prevPhotos, processedPhotoDict]);

  // Memoize the final photos array to prevent unnecessary rerenders
  const photos = useMemo(() => {
    // Use previous photos during loading to maintain layout, or current photos when available
    return isLoading && prevPhotos.length > 0 ? prevPhotos : currentPhotos;
  }, [isLoading, prevPhotos.length, currentPhotos.length, currentPhotos]);

  return (
    <div className="w-full">
      {isBrowser && (
        <InfiniteScroll
          isLoadingInitial={isLoading}
          isLoadingMore={isFetchingNextPage}
          loadMore={() => hasNextPage && fetchNextPage()}
          hasNextPage={!!hasNextPage}
        >
          {isLoading && prevPhotos.length === 0 ? (
            // Only show skeletons when we don't have previous photos to display
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
                    <Skeleton
                      key={index}
                      height={200}
                      baseColor="#1a1a1a"
                      highlightColor="#333"
                    />
                  ))}
              </div>
            </div>
          ) : (
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
          )}
        </InfiniteScroll>
      )}
      {isBrowser && imageIndex > -1 && photos[imageIndex] && (
        <ImageView photo={photos[imageIndex]} setImageIndex={setImageIndex} />
      )}
    </div>
  );
}

function PhotoWithAuthor({
  context,
  handleImageIndex,
}: {
  context: ExtendedRenderPhotoContext;
  handleImageIndex: (context: RenderPhotoContext) => void;
}) {
  // Ensure authorId is always a string and has a value
  const authorId = context?.photo?.author || "";

  const { data: userName, isLoading: isUserLoading } =
    useAuthorUsername(authorId);
  const { data: image, isLoading: imageLoading } = useAuthorImage(authorId);

  return (
    <PhotoOverlay
      setImageIndex={() => handleImageIndex(context)}
      context={context}
    >
      <div className="hidden md:flex absolute items-center gap-1 bottom-2 left-2 ">
        {!isUserLoading && !imageLoading && userName && (
          <Link
            href={authorId ? `/home/profile/${authorId}` : "#"}
            className="flex items-center gap-2"
          >
            <div className="rounded-full">
              {image ? (
                <OptimizedImage
                  className="rounded-full drop-shadow-lg"
                  src={image}
                  width={24}
                  height={24}
                  alt={`${userName}'s profile`}
                  isProfile={true}
                  trackPerformance={true}
                  imageName={`profile-${authorId}`}
                  username={userName || ""}
                  isAvatar={true}
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full" /> // Fallback avatar
              )}
            </div>
            <p className="font-light text-sm drop-shadow-lg">
              {formatDisplayName(userName)}
            </p>
          </Link>
        )}
      </div>
    </PhotoOverlay>
  );
}
