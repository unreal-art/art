"use client";
import React from "react";
import {
  MasonryPhotoAlbum,
  RenderImageContext,
  RenderImageProps,
  RenderPhotoContext,
} from "react-photo-album";
import "react-photo-album/masonry.css";
import { useEffect, useState, useMemo } from "react";
import { MD_BREAKPOINT } from "@/app/libs/constants";
import PhotoOverlay, { ExtendedRenderPhotoContext } from "../photoOverlay";
import ImageView from "../imageView";
import InfiniteScroll from "../InfiniteScroll";
import { formattedPhotosForGallery } from "../../formattedPhotos";
import { useSearchParams } from "next/navigation";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import useAuthorImage from "@/hooks/useAuthorImage";
import { useSearchPostsInfinite } from "@/hooks/useSearchPostsInfinite";
import { useGalleryStore } from "@/stores/galleryStore";
import OptimizedImage from "@/app/components/OptimizedImage";
import { capitalizeFirstAlpha, formatDisplayName } from "@/utils";

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
    const [videoLoaded, setVideoLoaded] = useState(false);

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

    // Extract image name for tracking
    const imageName = useMemo(() => {
      return typeof photo === "object" && photo !== null && "src" in photo
        ? String(photo.src).split("/").pop()?.split("?")[0] ||
          `search-img-${index}`
        : `search-img-${index}`;
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
              {!videoLoaded && (
                <div className="absolute inset-0 bg-primary-13 rounded-lg flex items-center justify-center">
                  <div className="text-primary-3 text-sm">Loading video...</div>
                </div>
              )}
              <video
                src={typeof photo === 'object' && photo.src ? photo.src : photo}
                className="w-full h-full object-cover rounded-lg"
                muted
                loop
                playsInline
                preload="metadata"
                controlsList="nodownload"
                style={{ display: videoLoaded ? 'block' : 'none' }}
                onMouseEnter={(e) => {
                  const video = e.currentTarget;
                  if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
                    video.play().catch(err => console.log('Play failed:', err));
                  }
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget;
                  video.pause();
                  video.currentTime = 0; // Reset to first frame for thumbnail
                }}
                onLoadedMetadata={(e) => {
                  console.log('Video metadata loaded for:', typeof photo === 'object' && photo.src ? photo.src : photo);
                  // Ensure video shows first frame as thumbnail
                  e.currentTarget.currentTime = 0.1;
                  setVideoLoaded(true);
                }}
                onCanPlay={(e) => {
                  console.log('Video can play:', typeof photo === 'object' && photo.src ? photo.src : photo);
                  setVideoLoaded(true);
                }}
                onError={(e) => {
                  console.log('Video load error for src:', typeof photo === 'object' && photo.src ? photo.src : photo);
                  console.log('Video error event:', e);
                  setVideoLoaded(false);
                  setHasError(true);
                }}
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
              src={hasError ? "/placeholder-image.jpg" : photo}
              alt={alt || "Search result"}
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

export default function SearchPhotoGallary({
  searchTerm,
}: {
  searchTerm: string;
}) {
  // All useState hooks first to maintain consistent order
  const [imageIndex, setImageIndex] = useState(-1);
  const [columns, setColumns] = useState<number | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  // Create a dictionary to track already processed photos by their ID
  const [processedPhotoDict, setProcessedPhotoDict] = useState<Record<string, any>>({});

  // All external hooks next
  // Use Zustand store for tab state
  const { initFromUrl } = useGalleryStore();

  // Sync with URL on initial load
  const searchParams = useSearchParams();
  
  // Data fetching hook - always called regardless of conditions
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchPostsInfinite(searchTerm, 10);
  
  // Format photos safely with preserved references - placed BEFORE any conditional returns
  const photos = useMemo(() => {
    // Safely handle data even before it's loaded
    if (!data || !data.pages) return [];
    
    const formattedPhotos = formattedPhotosForGallery(data.pages);
    // Reuse existing photo references where possible
    return formattedPhotos.map(photo => processedPhotoDict[photo.id] || photo);
  }, [data, processedPhotoDict]);
  
  // Client-side initialization effect
  useEffect(() => {
    setIsClient(true);

    // Check if the function exists before calling it
    if (initFromUrl && searchParams) {
      const urlParam = searchParams.get("s");
      initFromUrl(urlParam);
    }
  }, [searchParams, initFromUrl]);

  // Update processed photo dictionary when new photos are loaded
  useEffect(() => {
    if (photos.length > 0 && !isLoading) {
      const newDict = { ...processedPhotoDict };
      let dictChanged = false;
      
      // Add any new photos to the dictionary
      photos.forEach(photo => {
        if (!newDict[photo.id]) {
          newDict[photo.id] = photo;
          dictChanged = true;
        }
      });
      
      // Only update state if the dictionary actually changed
      if (dictChanged) {
        setProcessedPhotoDict(newDict);
      }
    }
  }, [photos, isLoading, processedPhotoDict]);

  // Window resize handler
  useEffect(() => {
    if (typeof window === "undefined") return; // Ensure it runs only on the client

    const handleResize = () => {
      setColumns(window.innerWidth < MD_BREAKPOINT ? 2 : 5);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call initially to set correct columns

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handler function definitions AFTER all hooks
  const handleImageIndex = (context: RenderPhotoContext) => {
    setImageIndex(context.index);
  };

  // If still server-side or columns haven't been calculated, show a loading placeholder
  if (!isClient || columns === undefined) {
    return (
      <div className="flex items-center justify-center h-48">
        <p>Loading gallery...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="wrapper">
        {error && typeof error === "object" && "message" in error
          ? error.message
          : "An error occurred while loading search results"}
      </p>
    );
  }

  // Check if we have no data to display
  if (!data || data.pages.length === 0 || data.pages[0].data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full p-8">
        <p className="text-center text-lg">
          No results found for "{searchTerm}"
        </p>
        <p className="text-center text-sm mt-2 text-gray-500">
          Try different keywords or check your spelling
        </p>
      </div>
    );
  }


  return (
    <div className="w-full">
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
      {imageIndex > -1 && photos[imageIndex] && (
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
  // Safeguard against undefined context.photo
  if (!context || !context.photo) {
    return null;
  }

  const authorId = context.photo.author || ""; // Ensure it's always a string

  const { data: userName, isLoading: isUserLoading } =
    useAuthorUsername(authorId);
  const { data: image, isLoading: imageLoading } = useAuthorImage(authorId);

  return (
    <PhotoOverlay
      setImageIndex={() => handleImageIndex(context)}
      context={context}
    >
      <div className="hidden md:flex absolute  items-center gap-1 bottom-2 left-2">
        {!isUserLoading && !imageLoading && userName && (
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
                  isProfile={true}
                  username={userName || ""}
                  isAvatar={true}
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full" /> // Fallback avatar
              )}
            </div>
            <p className="font-semibold text-sm drop-shadow-lg">
              {formatDisplayName(userName)}
            </p>
          </>
        )}
      </div>
    </PhotoOverlay>
  );
}
