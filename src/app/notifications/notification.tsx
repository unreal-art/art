"use client";
import { Notification as NotificationType } from "$/types/data.types";
import Image from "next/image";
import { timeAgo } from "../libs/timeAgo";
import useAuthorImage from "@/hooks/useAuthorImage";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import { usePost } from "@/hooks/usePost";
import { getNotificationMessage } from "@/utils";
import { getImage, getMediaUrl } from "../home/formattedPhotos";
import { useMarkNotificationAsRead } from "@/hooks/useMarkNotificationAsRead";
import { useEffect } from "react";
import NotificationSkeleton from "./components/notificationSkeleton";
import Link from "next/link";
import profileImage from "@/assets/images/profile.jpg";

interface NotificationProps {
  notification: NotificationType;
  onClick: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  notification,
  onClick,
}) => {
  const { data: image } = useAuthorImage(notification?.sender_id);
  const { data: username } = useAuthorUsername(notification?.sender_id);
  const { data: post } = usePost(notification?.post_id);

  const markAsReadMutation = useMarkNotificationAsRead();

  // Mark notification as read once it's fully loaded and all data is available
  useEffect(() => {
    if (notification.id && !notification.is_read) {
      console.log(
        `[Notification ${notification.id}] Checking if should mark as read`,
      );

      // Only mark as read when all data is loaded and visible to user
      if (post && image && username) {
        console.log(`[Notification ${notification.id}] Marking as read`);
        markAsReadMutation.mutate(notification.id);
      }
    }
  }, [notification, image, username, post, markAsReadMutation]);

  if (!post || !image || !username) return <NotificationSkeleton />;
  return (
    <Link
      href={`/home/photo/${post.id}`}
      onClick={onClick}
      className="border-primary-8 border-[1px] flex items-center bg-primary-12 h-28 my-4 rounded-[20px] p-3"
    >
      <div className="flex gap-2 justify-between items-center  w-full">
        <div className="w-[80%] ">
          <p className="text-[10px] text-primary-7">
            {timeAgo(notification?.created_at)}
          </p>

          <div className="flex gap-2 mt-1 w-ful">
            <div className="basis-10 ">
              <Image
                src={image || profileImage}
                width={36}
                height={36}
                alt="profile"
                className="rounded-full"
              />
            </div>

            <div className=" ">
              <p className="text-primary-4 text-md font-medium">{username}</p>
              <p className="text-primary-6 text-sm">
                {getNotificationMessage(notification.type, username)}
              </p>
            </div>
          </div>
        </div>

        <div className="basis-20  flex items-center w-[20%] ">
          {post?.media_type === 'VIDEO' ? (
            // Render video thumbnail for video posts
            <video
              src={getMediaUrl(post as any)}
              width={70}
              height={70}
              className="object-cover rounded"
              preload="metadata"
              muted
              controlsList="nodownload"
              onLoadedMetadata={(e) => {
                e.currentTarget.currentTime = 0.1;
              }}
            />
          ) : (
            // Render image thumbnail for image posts
            <Image
              src={
                Array.isArray(post?.ipfsImages) &&
                post.ipfsImages.length > 0 &&
                typeof post.ipfsImages[0] === "object" &&
                post.ipfsImages[0] !== null &&
                "hash" in post.ipfsImages[0] &&
                "fileNames" in post.ipfsImages[0] &&
                Array.isArray(post.ipfsImages[0].fileNames) &&
                post.ipfsImages[0].fileNames.length > 0
                  ? getImage(
                      post.ipfsImages[0].hash as string,
                      post.ipfsImages[0].fileNames[0] as string,
                      post.author,
                    )
                  : profileImage
              }
              width={70}
              height={70}
              alt="post media"
              className="object-cover rounded"
            />
          )}
        </div>
      </div>
    </Link>
  );
};

export default Notification;
/**

 */
