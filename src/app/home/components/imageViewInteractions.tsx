"use client"
import { supabase } from "$/supabase/client"
import { downloadImage, formatNumber } from "@/utils"
import {
  DownloadIcon,
  HeartFillIcon,
  HeartIcon,
  MessageIcon,
  ShareIcon,
} from "@/app/components/icons"
import { useLikePost } from "@/hooks/useLikePost"
import { usePost } from "@/hooks/usePost"
import { usePostLikes } from "@/hooks/usePostLikes"
import { useUser } from "@/hooks/useUser"
import React, { useState } from "react"
import { getImage } from "../formattedPhotos"
import { Post, UploadResponse } from "$/types/data.types"
import ShareModal from "./modals/shareModal"
import { useCountShareNotifications } from "@/hooks/useNotifications"

interface IInteractions {
  commentCount: number
  postId: string
}
export default function ImageViewInteractions({
  commentCount,
  postId,
}: IInteractions) {
  const { data: likes } = usePostLikes(Number(postId), supabase)
  const { userId } = useUser()
  const { data: post } = usePost(Number(postId))

  const [openShare, setOpenShare] = useState(false)
  const { mutate: toggleLike } = useLikePost(
    Number(postId),
    userId,
    post?.author as string
  )
  const { shareCount: shareNotifications } = useCountShareNotifications(
    Number(postId)
  )
  const userHasLiked = likes?.some((like) => like.author === userId)

  return (
    <div className="flex justify-between w-full relative h-8">
      <button
        onClick={() => toggleLike()}
        className="flex items-center gap-[2px] justify-center"
      >
        {userHasLiked ? (
          <HeartFillIcon color="#FFFFFF" />
        ) : (
          <HeartIcon color="#FFFFFF" />
        )}
        <p className="text-xs text-primary-3">
          {formatNumber(likes?.length as number)}
        </p>
      </button>

      <button className="flex items-center gap-[2px] justify-center">
        <MessageIcon color="#F0F0F0" />
        <p className="text-xs text-primary-3">{formatNumber(commentCount)}</p>
      </button>

      <button
        onClick={() => setOpenShare(true)}
        className="flex items-center gap-[2px] justify-center"
      >
        <ShareIcon color="#F0F0F0" />
        <p className="text-xs text-primary-3">{shareNotifications}</p>
      </button>

      {post && userId && openShare && (
        <div className="fixed z-50 top-0 left-0 h-screen w-full">
          {" "}
          <ShareModal
            open={openShare}
            post={post as Post}
            userId={userId as string}
            setOpen={setOpenShare}
            link={"https://art.ideomind.org/home/photo/" + postId}
          />
        </div>
      )}

      <button
        onClick={() =>
          downloadImage(
            getImage(
              (post?.ipfsImages as UploadResponse[])?.[0]?.hash,
              (post?.ipfsImages as UploadResponse[])?.[0]?.fileNames[0],
              post?.author as string
            ),
            (post?.ipfsImages as UploadResponse[])?.[0]?.fileNames[0]
          )
        }
      >
        <DownloadIcon color="#F0F0F0" />
      </button>
    </div>
  )
}
