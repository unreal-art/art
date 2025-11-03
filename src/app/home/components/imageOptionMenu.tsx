"use client"
import { ReactNode, useState } from "react"
import {
  DownloadIcon,
  PinFillIcon,
  PinIcon,
  ShareIcon,
  UserIcon,
} from "../../components/icons"
import { useUser } from "@/hooks/useUser"
import { IPhoto } from "@/app/libs/interfaces"
import { useRouter } from "next/navigation"
import {
  useIsPostPinned,
  usePinPost,
  useUnpinPost,
} from "@/hooks/usePinnedPosts"
import { downloadImage } from "@/utils"
import { Post } from "$/types/data.types"
import Link from "next/link"
import { usePost } from "@/hooks/usePost"
import ShareModal from "./modals/shareModal"
import { toast } from "sonner"
import { Following } from "./followingBtn"

interface ImageOptionMenuProps {
  children: ReactNode
  image: IPhoto
  postId?: string
}

export default function ImageOptionMenu({
  children,
  image,
  postId,
}: ImageOptionMenuProps) {
  const { userId } = useUser()
  const [open, setOpen] = useState(false)
  const [openShare, setOpenShare] = useState(false)

  const router = useRouter()

  const { isPinned, setPinned } = useIsPostPinned(
    Number(postId),
    userId as string
  )
  const { data: post } = usePost(Number(postId))
  const pinPostMutation = usePinPost(userId as string)
  const unpinPostMutation = useUnpinPost(userId as string)

  const handleClose = () => {
    setOpen(false)
  }

  const handlePrompt = () => {
    router.push("/home/photo/" + image.id)
    handleClose()
  }

  const handleCreator = () => {
    router.push("/home/profile/" + image.author)
    handleClose()
  }

  const togglePostPin = () => {
    if (!userId || !postId) return

    setPinned(!isPinned)

    if (!isPinned) {
      pinPostMutation.mutate(Number(postId), {
        onError: (error) => {
          setPinned(false)
          toast.error(`Failed to pin post: ${error.message}`)
        },
      })
    } else {
      unpinPostMutation.mutate(Number(postId), {
        onError: (error) => {
          setPinned(true)
          toast.error(`Failed to unpin post: ${error.message}`)
        },
      })
    }
  }
  return (
    <div className="relative">
      <button className="" onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed z-50  top-0 left-0 h-screen w-full"
          ></div>

          <div className="absolute w-[180px] xl:w-[200px] z-50 top-2 md:top-6 right-1 xl:right-0 border-primary-8 border-[1px] bg-[#191919] bg-primary-12 rounded-lg">
            {/* <MenuItem onClick={handlePrompt} icon={<PromptIcon width={16} height={16} color="#8F8F8F" />} text="Prompt" underlineOff={true} /> */}

            {/* <MenuItem onClick={handleClose} icon={<NoteIcon width={16} height={16} color="#8F8F8F" />} text="Upscale" /> */}

            <MenuItem
              onClick={togglePostPin}
              icon={
                isPinned ? (
                  <PinFillIcon width={16} height={16} color="#F0F0F0" />
                ) : (
                  <PinIcon width={16} height={16} color="#8F8F8F" />
                )
              }
              text={isPinned ? "Unpin" : "Pin"}
              underlineOff={true}
            />

            <MenuItem
              onClick={() => {
                if (!image.src) {
                  handleClose()
                  return
                }
                downloadImage(image.src)
                handleClose()
              }}
              icon={<DownloadIcon width={16} height={16} color="#8F8F8F" />}
              text="Download media"
              underlineOff={true}
            />

            {post && userId && (
              <MenuItem
                onClick={() => {
                  setOpenShare(true)
                  handleClose()
                }}
                icon={<ShareIcon width={16} height={16} color="#8F8F8F" />}
                text="Share"
              />
            )}

            <Link href={image.author ? "/home/profile/" + image.author : "#"}>
              <MenuItem
                onClick={handleCreator}
                icon={<UserIcon width={16} height={16} color="#8F8F8F" />}
                text="Creator profile"
                underlineOff={true}
              />
            </Link>

            <div className="w-full lg:hidden">
              <Following authorId={image.author || ""} isList={true} />
            </div>
            {/* <MenuItem
              onClick={handleClose}
              icon={<FlagIcon width={16} height={16} color="#FDA29B" />}
              text="Report post"
              color={"#FDA29B"}
            /> */}
          </div>
        </>
      )}

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
    </div>
  )
}

// export function MenuItem({ icon, text, underlineOff, action, color, onClick } : { icon: ReactNode, text: string, color?: string, onClick?: () => void,  underlineOff?: boolean, action?: ReactNode }) {
//   const handlePrompt = () => {
//     router.push("/home/photo/" + image.id);
//     handleClose();
//   };

//   return (
//     <div className="relative flex">
//       <button className=" self-end" onClick={() => setOpen(true)}>
//         {children}
//       </button>

//       {open && (
//         <>
//           <div
//             onClick={() => setOpen(false)}
//             className="fixed z-50  top-0 left-0 h-screen w-full"
//           ></div>

//           <div className="absolute w-[240px] z-50 top-2 md:top-6 right-0 border-primary-8 border-[1px] bg-[#191919] bg-primary-12 rounded-lg">
//             <MenuItem
//               onClick={handlePrompt}
//               icon={<PromptIcon width={16} height={16} color="#8F8F8F" />}
//               text="Prompt"
//               underlineOff={true}
//             />

//             <MenuItem
//               onClick={handleClose}
//               icon={<NoteIcon width={16} height={16} color="#8F8F8F" />}
//               text="Upscale"
//             />

//             <MenuItem
//               onClick={handleClose}
//               icon={<PinIcon width={16} height={16} color="#8F8F8F" />}
//               text="Pin"
//               underlineOff={true}
//             />

//             <MenuItem
//               onClick={handleClose}
//               icon={<DownloadIcon width={16} height={16} color="#8F8F8F" />}
//               text="Download JPEG"
//               underlineOff={true}
//             />

//             <MenuItem
//               onClick={handleClose}
//               icon={<ShareIcon width={16} height={16} color="#8F8F8F" />}
//               text="Share"
//             />

//             <MenuItem
//               onClick={handleClose}
//               icon={<UserIcon width={16} height={16} color="#8F8F8F" />}
//               text="Go to creator profile"
//             />

//             <MenuItem
//               onClick={handleClose}
//               icon={<FlagIcon width={16} height={16} color="#FDA29B" />}
//               text="Report post"
//               color={"#FDA29B"}
//             />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

export function MenuItem({
  icon,
  text,
  underlineOff,
  action,
  color,
  onClick,
}: {
  icon: ReactNode
  text: string
  color?: string
  onClick?: () => void
  underlineOff?: boolean
  action?: ReactNode
}) {
  return (
    <div
      style={{ color }}
      onClick={onClick}
      className={`flex justify-between py-2 px-4 border-primary-8 text-primary-6 h-10 cursor-pointer ${
        !underlineOff ? "border-b-[1px]" : ""
      }`}
    >
      <div className="flex gap-2 items-center justify-center text-sm md:text-base">
        <div>{icon}</div>
        <p>{text}</p>
      </div>
      {action}
    </div>
  )
}

//#FDA29B
