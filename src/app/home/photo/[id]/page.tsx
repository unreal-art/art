"use client";
import React, { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import GenerateInput from "../../components/generateInput";
import dynamic from "next/dynamic";
import Image from "next/image";
import Prompt from "../components/prompt";
import Feature from "../components/feature";
import CaptionInput from "../components/captionInput";
import Interactions from "../components/interactions";
import PostingActions from "../components/postingActions";
import { BackIcon, OptionMenuIcon } from "@/app/components/icons";
import { usePost, useUpdatePost, prefetchPost } from "@/hooks/usePost";
import { useUser } from "@/hooks/useUser";
import useAuthorImage from "@/hooks/useAuthorImage";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import { getImage } from "../../formattedPhotos";
import { UploadResponse } from "$/types/data.types";
import {
  formatDate,
  formatDisplayName,
  getImageResolution,
  truncateText,
} from "@/utils";
import { useState, useEffect, useCallback } from "react";
import EnhancedVideoPlayer from "@/app/components/EnhancedVideoPlayer";
import "react-loading-skeleton/dist/skeleton.css";
import ViewSkeleton from "../components/viewSkeleton";
import Link from "next/link";
// Head is not needed in App Router
import { toast } from "sonner";
import ImageOptionMenu from "../../components/imageOptionMenu";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "$/supabase/client";
import { IPhoto } from "@/app/libs/interfaces";
import OptimizedImage from "@/app/components/OptimizedImage";
import { Following } from "../../components/followingBtn";
import { ErrorBoundary } from "@/app/components/errorBoundary";
import VideoStatusPoll from "../../components/videoStatusPoll";

const PhotoGallaryTwo = dynamic(
  () => import("../../components/photoGalleryTwo"),
  {
    ssr: false,
  }
);

// Component that uses useSearchParams wrapped in Suspense
function GenerationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const a = searchParams.get("a");
  const { id } = useParams();

  const queryClient = useQueryClient();

  // Ensure id is valid before making API call
  const postId = id ? parseInt(id as string) : null;

  const {
    data: post,
    isLoading: loadingPost,
    error: postError,
    updatePostOptimistically,
  } = usePost(postId);

  const {
    updatePost,
    // loading: updatingPost,
    // error: updateError,
  } = useUpdatePost();
  const { userId, loading: loadingUser } = useUser();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { data: authorImage } = useAuthorImage(post?.author);
  const { data: authorUsername } = useAuthorUsername(post?.author);
  const [caption, setCaption] = useState(post?.caption || "");
  const [privatePost, setPrivatePost] = useState(post?.isPrivate);
  const [isFetching, setIsFetching] = useState(true);
  const [dynamicTitle, setDynamicTitle] = useState("Default Title");
  const [dynamicDescription, setDynamicDescription] = useState(
    "Default Description"
  );
  const [commentPhoto, setCommentPhoto] = useState<IPhoto | boolean>(false);
  const [dynamicImage, setDynamicImage] = useState("/default-image.jpg");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Handle video ready callback - moved to top to maintain hook order
  const handleVideoReady = useCallback((url: string) => {
    setVideoUrl(url);
    // Refresh the post data to get updated video_data
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
  }, [queryClient, postId]);

  // Helper function to get media URL for both images and videos - moved before useEffect
  const getMediaUrl = useCallback((index: number = 0) => {
    if (post?.media_type === 'VIDEO') {
      // For video posts, only return URL if we have video_data
      if (post?.video_data) {
        const videoData = Array.isArray(post.video_data) ? post.video_data[index] : post.video_data;
        if (videoData && typeof videoData === 'object' && 'hash' in videoData) {
          // For videos, the hash field contains the direct URL
          const videoUrl = (videoData as any).hash;
          // Check if it's already a full URL
          if (videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))) {
            return videoUrl;
          }
          // Fallback to getImage if it's actually a hash
          if ('fileNames' in videoData && (videoData as any).fileNames?.[0]) {
            return getImage(videoUrl, (videoData as any).fileNames[0], post?.author as string);
          }
        }
        // Fallback for different video data structures
        if (videoData && typeof videoData === 'object') {
          return (videoData as any)?.url || (videoData as any)?.src || (videoData as any)?.hash || "";
        }
      }
      // Return empty string for video posts without video_data (don't fall back to images)
      return "";
    } else {
      // Handle image data (existing behavior)
      return getImage(
        (post?.ipfsImages as UploadResponse[])?.[index]?.hash,
        (post?.ipfsImages as UploadResponse[])?.[index]?.fileNames[0],
        post?.author as string
      );
    }
  }, [post]);

  useEffect(() => {
    if (!loadingUser && !loadingPost && post) {
      setIsFetching(false); // Only set false when loading completes
    }
  }, [loadingUser, loadingPost, post]);

  useEffect(() => {
    // Example: Fetch data dynamically
    const fetchData = async () => {
      // Get media URL for the first item (works for both images and videos)
      const mediaUrl = getMediaUrl(0);
      
      // Simulate API response
      const data = {
        title: post?.caption || truncateText(post?.prompt, 10),
        description: truncateText(post?.prompt, 100),
        image: mediaUrl,
      };

      setDynamicTitle(data.title);
      setDynamicDescription(data.description);
      setDynamicImage(data.image);
      setCommentPhoto({
        id: String(post?.id),
        src: data.image,
        author: post?.author,
      });
    };

    if (post) {
      fetchData();
    }
  }, [post]);

  // Sync state with post.isPrivate whenever post changes
  useEffect(() => {
    setPrivatePost(post?.isPrivate);
    setCaption(post?.caption || "");
  }, [post]);

  useEffect(() => {
    // Redirect if there's an error (meaning no post to display)
    if (postError) {
      router.replace("/home");
      return;
    }

    // If `a` is true, only the owner should see the post
    if (a && userId && post && post.author !== userId) {
      router.replace("/home");
    }
  }, [a, userId, post?.author, postError, router]);

  // Prefetch related posts by the same author
  useEffect(() => {
    if (post?.author && postId !== null) {
      // This is a placeholder - you would need to implement a function to get other posts by author
      const fetchRelatedPosts = async () => {
        try {
          const { data: otherPosts } = await supabase
            .from("posts")
            .select("id")
            .eq("author", post.author)
            .neq("id", postId)
            .limit(5);

          // Prefetch the first few posts by the same author
          otherPosts?.forEach((relatedPost: { id: number }) => {
            prefetchPost(queryClient, relatedPost.id);
          });
        } catch (error) {
          console.error("Error prefetching related posts:", error);
        }
      };

      fetchRelatedPosts();
    }
  }, [post?.author, postId, queryClient]);

  //save post as draft with optimistic updates
  const saveAsDraft = async () => {
    if (!post?.id) return;

    const data = {
      caption,
      isPrivate: privatePost,
      isDraft: true,
    };

    // Optimistically update the UI
    updatePostOptimistically(data);

    try {
      const success = await updatePost(post.id, data);
      if (success) {
        toast("Post saved to draft");
      } else {
        toast.error("Failed to save post to draft");
      }
    } catch (error) {
      toast.error(`Error saving draft: ${(error as Error).message}`);
    }
  };

  //post image to db with optimistic updates
  const postImage = async () => {
    if (!post?.id) return;

    const data = {
      caption,
      isPrivate: privatePost,
      isDraft: false,
    };

    // Optimistically update the UI
    updatePostOptimistically(data);

    try {
      const success = await updatePost(post.id, data);
      if (success) {
        toast.success("Post published successfully!");
        //redirect to post page
        router.replace(`/home/creations?s=public`);
      } else {
        toast.error("Failed to publish post");
      }
    } catch (error) {
      toast.error(`Error publishing post: ${(error as Error).message}`);
    }
  };

  if (isFetching) {
    return <ViewSkeleton />;
  }


  // Get the selected media URL
  const mainMediaUrl = getMediaUrl(selectedImageIndex);
  console.log('mainMediaUrl:', mainMediaUrl)

  // Check if this is a video post without video data yet (need polling)
  const needsVideoPolling = post?.media_type === 'VIDEO' && 
    post?.jobId && 
    (!post?.video_data || 
     (Array.isArray(post.video_data) && post.video_data.length === 0) || 
     mainMediaUrl === "" || 
     !mainMediaUrl);

  console.log('Video polling check:', {
    mediaType: post?.media_type,
    jobId: post?.jobId,
    hasVideoData: !!post?.video_data,
    videoDataLength: Array.isArray(post?.video_data) ? post.video_data.length : 'not array',
    mainMediaUrl,
    needsVideoPolling
  });
  
  return (
    <div className="w-full">
      <div className="hidden md:flex flex-col justify-center items-center pt-5 w-full">
        <GenerateInput />
      </div>

      <div className="flex gap-x-2 items-center w-full h-10 mt-8 md:mt-0 mb-2">
        <button
          className="flex gap-x-1 items-center text-sm"
          onClick={() => router.back()}
        >
          <BackIcon width={16} height={16} color="#5D5D5D" />
          <p>Back</p>
        </button>
      </div>

      <div className="overflow-y-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 w-full">
          {/* Main Content Column */}
          <div className="flex flex-col justify-between items-center col-span-9">
            <div className="flex justify-between h-24 p-6 gap-5 w-full">
              <Link
                href={post?.author ? `/home/profile/${post?.author}` : "#"}
                className="flex gap-1"
              >
                <div>
                  {authorImage ? (
                    <OptimizedImage
                      className="rounded-full drop-shadow-lg"
                      src={authorImage}
                      width={48}
                      height={48}
                      alt={`${authorUsername}'s profile`}
                      isProfile={true}
                      trackPerformance={true}
                      imageName={`profile-${post?.author}`}
                      username={authorUsername || ""}
                      isAvatar={true}
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg leading-6 text-primary-2">
                    {authorUsername && formatDisplayName(authorUsername)}
                  </p>
                  <p className="text-primary-7 nasalization">Creator</p>
                </div>
              </Link>

              {post && post.author && <Following authorId={post?.author} />}
            </div>

            <div className="flex justify-center w-full relative">
              <ErrorBoundary
                fallback={
                  <div className="w-[306px] h-[408px] sm:w-[350px] sm:h-[450px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] xl:w-[500px] xl:h-[600px] flex items-center justify-center bg-primary-13 rounded-lg">
                    <p className="text-primary-3">Unable to load {post?.media_type === 'VIDEO' ? 'video' : 'image'}</p>
                  </div>
                }
              >
                <div className="relative w-[306px] h-[408px] sm:w-[350px] sm:h-[450px] md:w-[400px] md:h-[500px] lg:w-[450px] lg:h-[550px] xl:w-[500px] xl:h-[600px]">
                  {needsVideoPolling && post?.id && post?.jobId ? (
                    // Show video status polling component while video is being generated
                    <VideoStatusPoll 
                      postId={post.id} 
                      jobId={post.jobId} 
                      onVideoReady={handleVideoReady} 
                    />
                  ) : post?.media_type === 'VIDEO' ? (
                    // Show video once it's ready
                    <EnhancedVideoPlayer
                      src={mainMediaUrl}
                      className="object-contain w-full h-full enhanced-player-container"
                      title={`${post?.author || 'Unreal'}'s Creation`}
                      controls={true}
                      playsInline={true}
                    />
                  ) : (
                    // Show image
                    <OptimizedImage
                      className="object-contain w-full h-full"
                      src={mainMediaUrl}
                      width={0}
                      height={0}
                      alt={`unreal-${post?.media_type === 'VIDEO' ? 'video' : 'image'}-${post?.id}`}
                      priority={true}
                      loading="eager"
                      trackPerformance={true}
                      imageName={`view-${post?.id}`}
                    />
                  )}
                </div>
              </ErrorBoundary>
            </div>

            <div className="flex flex-col w-full px-1 mt-8 md:mt-0 md:px-6 gap-y-4">
              <CaptionInput
                caption={caption as string}
                setCaption={setCaption}
                readOnly={userId !== post?.author}
              />
              {post && (
                <Interactions
                  postId={post?.id as number}
                  postDetails={commentPhoto as IPhoto}
                  selectedImageIndex={selectedImageIndex}
                />
              )}
              {post && userId == post?.author && (
                <PostingActions
                  privatePost={privatePost as boolean}
                  setPrivatePost={setPrivatePost}
                  saveAsDraft={saveAsDraft}
                  postImage={postImage}
                  isDraft={post.isDraft as boolean}
                />
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-span-3 border-[1px] border-primary-11 bg-primary-12 rounded-r-[20px] p-6 overflow-y-auto">
            <div className="h-36">
              <p className="text-primary-5 text-lg">Output quantity</p>

              <div className="py-2 relative flex gap-2 overflow-x-auto">
                {post?.media_type === 'VIDEO' ? (
                  // Handle video thumbnails
                  Array.isArray(post?.video_data) ? post.video_data.map((_: any, index: number) => (
                    <div
                      key={index}
                      className={`relative hover:opacity-100 transition-opacity duration-200 cursor-pointer ${
                        selectedImageIndex == index ? "opacity-100" : "opacity-20"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <video
                        src={getMediaUrl(index)}
                        width={98}
                        height={128}
                        className="object-cover"
                        preload="metadata"
                        controlsList="nodownload"
                        muted
                      />
                      {/* Video indicator overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-4 border-l-black border-y-2 border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    // Single video case
                    <div
                      className={`relative hover:opacity-100 transition-opacity duration-200 cursor-pointer ${
                        selectedImageIndex == 0 ? "opacity-100" : "opacity-20"
                      }`}
                      onClick={() => setSelectedImageIndex(0)}
                    >
                      <video
                        src={getMediaUrl(0)}
                        width={98}
                        height={128}
                        className="object-cover"
                        preload="metadata"
                        muted
                      />
                      {/* Video indicator overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-4 border-l-black border-y-2 border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  // Handle image thumbnails (existing behavior)
                  (post?.ipfsImages as UploadResponse[])?.map((image, index) => (
                    <Image
                      key={index}
                      src={getImage(
                        image.hash,
                        image.fileNames[0],
                        post?.author as string
                      )}
                      width={98}
                      height={128}
                      alt="generated"
                      className={`hover:opacity-100 transition-opacity duration-200 cursor-pointer ${
                        selectedImageIndex == index ? "opacity-100" : "opacity-20"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))
                )}
              </div>
            </div>

            <hr className="border-[1px] border-primary-10 my-2" />

            {/* Only creator sees the prompt */}
            {post?.author == userId && (
              <Prompt title="Prompt" fullText={post?.prompt || ""}>
                {truncateText(post?.prompt || "", 100)}
              </Prompt>
            )}

            {post?.author == userId && (
              <Prompt title="Magic Prompt" fullText={post?.prompt || ""}>
                {truncateText(post?.prompt || "", 100)}
              </Prompt>
            )}

            <div className="grid grid-cols-2 gap-6">
              <Feature title="Model" content="Dart 2.0" />
              <Feature title="Style" content="Default" />
              <MediaResolutionFeature
                mediaUrl={getMediaUrl(0)}
                mediaType={post?.media_type || 'IMAGE'}
              />
              <Feature title="Rendering" content="Default" />
              <Feature title="Seed" content={post?.seed?.toString() || ""} />
              <Feature
                title="Date"
                content={formatDate(post?.createdAt as string)}
              />
            </div>
          </div>
        </div>

        {/* Related Posts Section */}
        <p className="h-14 py-2 border-y-[1px] border-primary-10 text-center leading-10 my-10">
          {a ? "Drafts" : "Other posts"} by{" "}
          <Link href={post?.author ? `/home/profile/${post?.author}` : "#"}>
            <strong className="text-primary-5 pl-1">
              {authorUsername && formatDisplayName(authorUsername)}
            </strong>
          </Link>
        </p>

        <div>
          <ErrorBoundary
            fallback={
              <div className="p-8 text-center bg-primary-13 rounded-lg">
                <p className="text-primary-3 mb-4">
                  Unable to load related images
                </p>
                <button
                  className="px-4 py-2 bg-primary-5 text-white rounded-lg hover:bg-primary-6 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            }
          >
            <PhotoGallaryTwo />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// Export the component wrapped in Suspense
export default function Generation() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <GenerationContent />
    </Suspense>
  );
}

function MediaResolutionFeature({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: string }) {
  const [resolution, setResolution] = useState("Loading...");

  useEffect(() => {
    if (mediaUrl) {
      if (mediaType === 'VIDEO') {
        // For videos, we can try to get dimensions from video element
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.onloadedmetadata = () => {
          setResolution(`${video.videoWidth}x${video.videoHeight}`);
        };
        video.onerror = () => {
          setResolution("Error loading video");
        };
      } else {
        // For images, use existing function
        getImageResolution(mediaUrl)
          .then((res) => setResolution(res as string))
          .catch(() => setResolution("Error loading image"));
      }
    }
  }, [mediaUrl, mediaType]);

  return <Feature title="Resolution" content={resolution} />;
}
