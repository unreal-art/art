"use client"
import { supabase } from "$/supabase/client"
import {
  DownloadIcon,
  HeartFillIcon,
  PinFillIcon,
  HeartIcon,
  MessageIcon,
  PinIcon,
  ShareIcon,
  MintIcon,
  MintFillIcon,
} from "@/app/components/icons"
import { useComments, useRealtimeComments } from "@/hooks/useComments"
import { useLikePost } from "@/hooks/useLikePost"
import {
  useIsPostPinned,
  usePinPost,
  useUnpinPost,
} from "@/hooks/usePinnedPosts"
import { useQueryClient } from "@tanstack/react-query"
import { usePost } from "@/hooks/usePost"
import { usePostLikes } from "@/hooks/usePostLikes"
import { useUser } from "@/hooks/useUser"
import { getImage } from "../../formattedPhotos"
import { Post, UploadResponse } from "$/types/data.types"
import { downloadImage } from "@/utils"
import ShareModal from "../../components/modals/shareModal"
import { useState } from "react"
import { useCountShareNotifications } from "@/hooks/useNotifications"
import { toast } from "sonner"
import ImageView from "../../components/imageView"
import { IPhoto } from "@/app/libs/interfaces"
import MintModal from "../../components/mint/MintModal"
import { usePostMints } from "@/hooks/usePostMints"
import AnimatedCounter from "../../components/mint/AnimatedCounter"

export default function Interactions({
  postId,
  postDetails,
  selectedImageIndex,
}: {
  postId: number
  postDetails: IPhoto
  selectedImageIndex: number
}) {
  const [openShare, setOpenShare] = useState(false)
  const [openMintModal, setOpenMintModal] = useState(false)
  const [openComment, setOpenComment] = useState(false)
  const { data: likes } = usePostLikes(Number(postId), supabase)
  const { data: comments } = useComments(postId.toString())
  useRealtimeComments(postId.toString())
  const { userId } = useUser()
  const { data: post, updatePostOptimistically } = usePost(Number(postId))
  const { mutate: toggleLike } = useLikePost(
    Number(postId),
    userId,
    post?.author as string
  )
  const userHasLiked = likes?.some((like) => like.author === userId)
  const { data: isPinned, setPinned } = useIsPostPinned(
    postId,
    userId as string
  )
  // const { data: pinnedPosts } = usePinnedPosts(userId as string);
  const { mutate: pinPost } = usePinPost(userId as string)
  const { mutate: unpinPost } = useUnpinPost(userId as string)

  const { data: postMints } = usePostMints(Number(postId))
  // Safely access count property with type check
  const mintCount = postMints && "count" in postMints ? postMints.count : 0
  const { shareCount: shareNotifications } = useCountShareNotifications(postId)

  const togglePostPin = () => {
    if (!userId) return

    // Optimistically update the UI
    const newPinnedState = !isPinned

    // Update the isPinned state
    setPinned(newPinnedState)

    // Also update the post data to reflect the pin status
    updatePostOptimistically({
      isPinned: newPinnedState,
    })

    // Call the appropriate mutation
    if (newPinnedState) {
      pinPost(postId, {
        onError: (error) => {
          // If the mutation fails, revert the optimistic updates
          setPinned(false)
          updatePostOptimistically({
            isPinned: false,
          })
          toast.error(`Failed to pin post: ${error.message}`)
        },
      })
    } else {
      unpinPost(postId, {
        onError: (error) => {
          // If the mutation fails, revert the optimistic updates
          setPinned(true)
          updatePostOptimistically({
            isPinned: true,
          })
          toast.error(`Failed to unpin post: ${error.message}`)
        },
      })
    }
  }

  const togglePostMint = () => {
    if (!userId) return

    // Open mint modal when mint button is clicked (always allow minting)
    setOpenMintModal(true)
  }

  // Handle mint success from MintModal
  const queryClient = useQueryClient()

  const handleMintSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["post-mints", Number(postId)] })
    queryClient.invalidateQueries({ queryKey: ["minted-posts", userId] })
  }

  return (
    <>
      <div className="flex justify-between">
        <div className="flex py-2 gap-x-14">
          <button
            onClick={() => toggleLike()}
            className="flex items-center gap-[2px] justify-center"
          >
            {userHasLiked ? (
              <HeartFillIcon color="#FFFFFF" />
            ) : (
              <HeartIcon color="#FFFFFF" />
            )}
            <p className="text-xs text-primary-3">{likes?.length}</p>
          </button>

          <button
            onClick={() => setOpenComment(true)}
            className="flex items-center gap-[2px] justify-center"
          >
            <MessageIcon color="#F0F0F0" />
            <p className="text-xs text-primary-3">{comments?.length}</p>
          </button>

          <button
            onClick={() => setOpenShare(true)}
            className="flex items-center gap-[2px] justify-center"
          >
            <ShareIcon color="#F0F0F0" />
            <p className="text-xs text-primary-3">{shareNotifications}</p>
          </button>
        </div>

        <div className="flex py-2 gap-x-6">
          <button onClick={() => togglePostPin()}>
            {isPinned ? (
              <PinFillIcon color="#F0F0F0" />
            ) : (
              <PinIcon color="#F0F0F0" />
            )}
          </button>

          <button
            onClick={() => togglePostMint()}
            className="flex items-center gap-2 justify-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            title="Mint this post with ODP tokens"
          >
            <MintIcon color="#FFFFFF" width={20} height={20} />
            <p className="text-sm font-semibold text-white tracking-wide">
              Mint{" "}
              <AnimatedCounter
                value={mintCount}
                className="text-yellow-300 font-bold"
              />
            </p>
          </button>

          <button
            onClick={() =>
              downloadImage(
                getImage(
                  (post?.ipfsImages as UploadResponse[])[selectedImageIndex]
                    ?.hash,
                  (post?.ipfsImages as UploadResponse[])[selectedImageIndex]
                    ?.fileNames[0],
                  post?.author as string
                ),
                (post?.ipfsImages as UploadResponse[])[selectedImageIndex]
                  ?.fileNames[0]
              )
            }
          >
            <DownloadIcon color="#F0F0F0" />
          </button>
        </div>
        {post && userId && (
          <ShareModal
            open={openShare}
            post={post as Post}
            userId={userId as string}
            setOpen={setOpenShare}
            link={"https://art.ideomind.org/home/photo/" + postId}
          />
        )}
        <ImageView
          photo={openComment && postDetails}
          setImageIndex={() => setOpenComment(false)}
        />
        {post && userId && (
          <MintModal
            open={openMintModal}
            setOpen={setOpenMintModal}
            postId={postId}
            onMintSuccess={handleMintSuccess}
          />
        )}
      </div>
    </>
  )
}
