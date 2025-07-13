"use client";
import { HeartFillIcon, HeartIcon } from "@/app/components/icons";
import { CommentWithUser } from "$/types/data.types";
import { timeAgo } from "@/app/libs/timeAgo";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import Image from "next/image";
import {
  useLikeComment,
  useRealtimeReplies,
  useReplies,
  useUnlikeComment,
} from "@/hooks/useComments";
import Reply from "./Reply";
import { useState } from "react";
import { formatNumber } from "@/utils";
import OptimizedImage from "@/app/components/OptimizedImage";
import profileImage from "@/assets/images/profile.jpg";

import { useEffect, useRef } from "react";

export default function Comment({
  data,
  setReplyTo,
}: // setCommentToReply,
{
  data: CommentWithUser;
  setReplyTo: (data: CommentWithUser | null) => void;
  // setCommentToReply: (data: CommentWithUser) => void;
}) {
  const { data: user } = useAuthorUsername(data.user_id);
  const likeComment = useLikeComment(data.post_id.toString());
  const unlikeComment = useUnlikeComment(data.post_id.toString());
  const [seeMore, setSeeMore] = useState(false);

  // --- Optimistic UI state ---
  const [optimisticLiked, setOptimisticLiked] = useState(data.user_liked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(
    data.like_count,
  );
  const prevDataRef = useRef({
    user_liked: data.user_liked,
    like_count: data.like_count,
  });

  // Sync local state when props change (e.g., after parent re-render)
  useEffect(() => {
    if (
      data.user_liked !== prevDataRef.current.user_liked ||
      data.like_count !== prevDataRef.current.like_count
    ) {
      setOptimisticLiked(data.user_liked);
      setOptimisticLikeCount(data.like_count);
      prevDataRef.current = {
        user_liked: data.user_liked,
        like_count: data.like_count,
      };
    }
  }, [data.user_liked, data.like_count]);

  const handleLikeClick = () => {
    if (optimisticLiked) {
      setOptimisticLiked(false);
      setOptimisticLikeCount((c) => Math.max(0, c - 1));
      unlikeComment.mutate(data.id);
    } else {
      setOptimisticLiked(true);
      setOptimisticLikeCount((c) => c + 1);
      likeComment.mutate(data.id);
    }
  };

  const { data: replies } = useReplies(data.id);
  useRealtimeReplies(data.id);

  return (
    <div className=" gap-2 py-2  border-primary-10">
      <div className="flex w-full  gap-2">
        <div className="h-12 w-12">
          <OptimizedImage
            src={data.avatar_url || profileImage}
            isProfile={true}
            width={48}
            height={48}
            alt={`${user || "User"}'s profile picture`}
            className="rounded-full"
            trackPerformance={true}
            imageName={`comment-avatar-${data.user_id}`}
          />
        </div>
        <div className="w-full">
          <div className="flex flex-col basis-1/6">
            <p className="text-primary-4 text-md font-medium whitespace-nowrap">
              {user}
            </p>
            <p className="text-xs">{timeAgo(data.created_at)}</p>
          </div>

          <div className="flex gap-2 w-full py-2">
            <div className="flex-grow space-y-4 gap-4">
              <p className="text-primary-6 text-sm flex-grow">{data.content}</p>
              <button
                className="text-primary-8 hover:underline  text-xs "
                onClick={() => {
                  data.username = user as string;
                  setReplyTo(data);
                }}
              >
                reply{" "}
                {replies ? <span>({formatNumber(replies.length)})</span> : ""}
              </button>
            </div>
            <div className="justify-end">
              <button
                className="flex gap-1 items-center"
                onClick={handleLikeClick}
              >
                {optimisticLiked ? (
                  <HeartFillIcon color="#FFFFFF" />
                ) : (
                  <HeartIcon color="#FFFFFF" />
                )}
              </button>
              <p className="text-center">{formatNumber(optimisticLikeCount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reply list */}

      {replies
        ?.slice(0, seeMore ? replies.length : 2)
        .map((reply: CommentWithUser, idx: number) => (
          <Reply key={idx} data={reply} />
        ))}

      {replies && replies?.length > 2 && (
        <p className="text-right">
          <button
            onClick={() => setSeeMore(!seeMore)}
            className="text-xs hover:underline"
          >
            {seeMore ? "Show Less" : "See More"}
          </button>
        </p>
      )}
    </div>
  );
}
