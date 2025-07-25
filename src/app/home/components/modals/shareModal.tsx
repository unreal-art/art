"use client";
import Image from "next/image";
import ModalWrapper from "./modalWrapper";
import { Post } from "$/types/data.types";
import { addNotification } from "@/queries/post/addNotification";
import {
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
} from "react-share";
import { toast } from "sonner";
import { useCountShareNotifications } from "@/hooks/useNotifications";

interface ShareModalProps {
  link: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  userId?: string;
  post?: Post;
  isProfile?: boolean;
}

export default function ShareModal({
  link,
  open,
  setOpen,
  post,
  userId,
  isProfile,
}: ShareModalProps) {
  const { incrementShareCount } = post?.id
    ? useCountShareNotifications(post.id)
    : { incrementShareCount: () => {} };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log("Link copied to clipboard!");
        toast("copied");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  // const shareOnX = () => {
  //   //no notification for profile share
  //   if (!isProfile) {
  //     addNotification({
  //       userId: post?.author as string,
  //       senderId: userId as string,
  //       postId: post?.id as number,
  //       type: "share",
  //     });
  //   }
  //   const url = `https://x.com/share?url=${encodeURIComponent(link)}`;
  //   window.open(url, "_blank");
  // };

  const shareOnDiscord = () => {
    //no notification for profile share
    if (!isProfile && post?.id) {
      addNotification({
        userId: post?.author as string,
        senderId: userId as string,
        postId: post?.id as number,
        type: "share",
      });
      // Immediately increment the share count for better UX
      incrementShareCount();
    }
    const url = `https://discord.com/channels/@me?url=${encodeURIComponent(
      link,
    )}`;
    window.open(url, "_blank");
  };

  // const shareOnFacebook = () => {
  //   //no notification for profile share
  //   if (!isProfile) {
  //     addNotification({
  //       userId: post?.author as string,
  //       senderId: userId as string,
  //       postId: post?.id as number,
  //       type: "share",
  //     });
  //   }
  //   const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
  //     link,
  //   )}`;
  //   window.open(url, "_blank");
  // };

  // const shareOnLinkedIn = () => {
  //   //no notification for profile share
  //   if (!isProfile) {
  //     addNotification({
  //       userId: post?.author as string,
  //       senderId: userId as string,
  //       postId: post?.id as number,
  //       type: "share",
  //     });
  //   }
  //   const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
  //     link,
  //   )}`;
  //   window.open(url, "_blank");
  // };

  return (
    <ModalWrapper title={"Share"} open={open} setOpen={setOpen}>
      <div>
        <input
          className="w-full bg-primary-13 rounded-full text-primary-6 py-2 px-4 outline-none"
          type="text"
          value={link}
          readOnly
        />

        <div className="flex justify-evenly items-center  bg-primary-10 h-[104px] rounded-[20] mt-6">
          <div className="border-r-[1px]">
            <button onClick={copyToClipboard}>
              <ShareItem
                image="copy.png"
                text="Copy link"
              />
            </button>
          </div>

          <button onClick={shareOnDiscord}>
            <ShareItem
              image="discord.png"
              text="Discord"
            />
          </button>

          <TwitterShareButton 
            url={link} 
            title="ok"
            onClick={() => {
              if (!isProfile && post?.id) {
                addNotification({
                  userId: post?.author as string,
                  senderId: userId as string,
                  postId: post?.id as number,
                  type: "share",
                });
                // Immediately increment the share count
                incrementShareCount();
              }
            }}
          >
            <ShareItem
              image="x.png"
              text="Xapp"
            />
          </TwitterShareButton>
          <FacebookShareButton 
            url={link} 
            title="ok"
            onClick={() => {
              if (!isProfile && post?.id) {
                addNotification({
                  userId: post?.author as string,
                  senderId: userId as string,
                  postId: post?.id as number,
                  type: "share",
                });
                // Immediately increment the share count
                incrementShareCount();
              }
            }}
          >
            <ShareItem
              image="facebook.png"
              text="Facebook"
            />
          </FacebookShareButton>
          <LinkedinShareButton 
            url={link} 
            title="ok"
            onClick={() => {
              if (!isProfile && post?.id) {
                addNotification({
                  userId: post?.author as string,
                  senderId: userId as string,
                  postId: post?.id as number,
                  type: "share",
                });
                // Immediately increment the share count
                incrementShareCount();
              }
            }}
          >
            <ShareItem
              image="linkedin.png"
              text="LinkedIn"
            />
          </LinkedinShareButton>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ShareItem({
  image,
  text
}: {
  image: string;
  text: string;
}) {
  return (
    <span
      className={`flex items-center cursor-pointer justify-between flex-col px-2  h-14 ${
        image === "x.png" ? "pt-2" : ""
      } `}
    >
      <Image
        src={"/icons/" + image}
        width={image === "x.png" ? 27 : 36}
        height={image === "x.png" ? 27 : 36}
        alt=""
      />

      <p className={`text-primary-6 text-sm`}>{text}</p>
    </span>
  );
}
