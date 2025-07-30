"use client"
import { ReactNode, useState } from "react"
import { FlashIcon, LogoutIcon, MoonIcon } from "../components/icons"
import { useUser } from "@/hooks/useUser"
import Image from "next/image"
import Topup from "./topup"
import useAuthorImage from "@/hooks/useAuthorImage"
import Link from "next/link"
import { supabase } from "$/supabase/client"
import { useRouter } from "next/navigation"
import {
  formatDisplayName,
  getContractInstance,
  truncateEmail,
  truncateText,
} from "@/utils"
import { torusTestnet } from "$/constants/chains"
import { useReadContract } from "thirdweb/react"
import { formatEther } from "ethers"
import { log, logError } from "@/utils/sentryUtils"
import OptimizedImage from "../components/OptimizedImage"
import appConfig from "@/config"
import WalletButton from "../components/walletButton"

// Full-screen loading overlay component
function LogoutOverlay() {
  return (
    <div className="h-[100dvh] w-screen top-0 left-0 fixed z-[100] flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        {/* Loading indicator with pulse animation */}
        <div className="relative animate-pulse">
          <Image
            src="/Icon-White.png"
            alt="unreal"
            height={50}
            width={50}
            priority
          />
        </div>

        {/* Logout text */}
        <p className="text-white text-sm mt-2">Logging out...</p>
      </div>
    </div>
  )
}

interface INotificationProps {
  children: ReactNode
}

const dartContract = getContractInstance(
  torusTestnet,
  appConfig.blockchain.contracts.dart
)

// Separate client component for the button
function MenuButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return <button onClick={onClick}>{children}</button>
}

export default function Menu({ children }: INotificationProps) {
  const { userId, user, refetchUser } = useUser()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [topup, setTopup] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const { data: dartBalance, refetch } = useReadContract({
    contract: dartContract,
    method: "function balanceOf(address account) returns (uint256)",
    params: [user?.wallet?.address || ""],
  })

  const handleClose = () => {
    setOpen(false)
  }

  const handleTopup = () => {
    setTopup(true)
    handleClose()
  }

  const logoutUser = async () => {
    try {
      // First close the menu
      handleClose()
      // Then show the loading overlay
      setIsLoggingOut(true)

      // Small delay to ensure the overlay is visible
      await new Promise((resolve) => setTimeout(resolve, 100))
      //clear cookies
      const cookies = document.cookie.split(";")
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
      const { error } = await supabase.auth.signOut()
      if (error) {
        logError("Error logging out", error)
        setIsLoggingOut(false)
      } else {
        log("User logged out successfully")
        supabase.auth.signOut()
        // Use router.push for smoother navigation
        router.push("/auth")
        // No need to reset isLoggingOut as we're navigating away
      }
    } catch (err) {
      logError("Unexpected error during logout", err)
      setIsLoggingOut(false)
    }
  }
  return (
    <>
      <MenuButton onClick={() => setOpen(true)}>{children}</MenuButton>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed z-50  top-0 left-0 h-screen w-full"
          ></div>

          <div className="absolute w-full max-w-[240px] h-[300px] z-50 bottom-20 md:bottom-[5vh] right-4 md:left-44 border-primary-8 border-[1px] bg-[#191919] rounded-lg">
            <Link
              onClick={handleClose}
              href={userId ? `/home/profile/${userId}` : "/home"}
              className="flex items-center gap-2 text-primary-6 h-16 p-3 border-primary-8 border-b-[1px]"
            >
              <div>
                {/* <Image
                  className="rounded-full"
                  src={user?.avatar_url || "/profile.jpg"}
                  width={40}
                  height={40}
                  alt=""
                />
                 */}
                {user?.avatar_url ? (
                  <OptimizedImage
                    className="rounded-full drop-shadow-lg"
                    src={user?.avatar_url}
                    width={48}
                    height={48}
                    alt={`${user?.full_name || user?.username}'s profile`}
                    isProfile={true}
                    trackPerformance={true}
                    username={user?.full_name || user?.username || ""}
                    imageName={`profile-${user?.full_name || user?.username}`}
                    isAvatar={true}
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full" /> // Fallback avatar
                )}
              </div>
              <div className="flex flex-col">
                <p className="" title={user?.full_name ? user?.full_name : ""}>
                  {user?.full_name && formatDisplayName(user?.full_name)}
                </p>
                {user?.user_metadata.email && (
                  <p
                    className=""
                    title={
                      user?.user_metadata.email ? user?.user_metadata.email : ""
                    }
                  >
                    {truncateEmail(user?.user_metadata.email, 20)}
                  </p>
                )}
              </div>
            </Link>

            {/* Wallet Connection */}
            <div className="border-primary-8 border-b-[1px] py-2 flex justify-center items-center">
              <WalletButton />
            </div>

            <Link
              href={"https://www.linkedin.com/company/decenter-ai/"}
              target="_blank"
            >
              <MenuItem
                onClick={handleClose}
                icon={
                  <Image
                    src={"/icons/linkedin.png"}
                    width={16}
                    height={16}
                    alt="telegram"
                  />
                }
                text="LinkedIn"
                underlineOff={true}
              />
            </Link>

            <Link href={"https://t.me/decenteraicomchat"} target="_blank">
              <MenuItem
                onClick={handleClose}
                icon={
                  <Image
                    src={"/icons/telegram.png"}
                    width={16}
                    height={16}
                    alt="telegram"
                  />
                }
                text="Telegram"
                underlineOff={true}
              />
            </Link>

            <Link
              href={
                "https://twitter.com/decenteraicom?s=21&t=th7q1ztmiuaE2PoODm3k0A"
              }
              target="_blank"
            >
              <MenuItem
                onClick={handleClose}
                icon={
                  <Image src={"/icons/x.png"} width={16} height={16} alt="x" />
                }
                text="x  (formerly Twitter)"
              />
            </Link>

            {/* <MenuItem
              icon={<MoonIcon width={16} height={16} color="#C1C1C1" />}
              text="Dark Theme"
            /> */}

            <MenuItem
              onClick={logoutUser}
              icon={<LogoutIcon width={16} height={16} color="#C1C1C1" />}
              text={isLoggingOut ? "Logging out..." : "Logout"}
              underlineOff={true}
              disabled={isLoggingOut}
            />
          </div>
        </>
      )}

      <Topup open={topup} setOpen={setTopup} refetch={refetchUser} />

      {/* Show full-screen loading overlay when logging out */}
      {isLoggingOut && <LogoutOverlay />}
    </>
  )
}

export function MenuItem({
  icon,
  text,
  underlineOff,
  action,
  onClick,
  disabled,
}: {
  icon: ReactNode
  text: string
  onClick?: () => void
  underlineOff?: boolean
  action?: ReactNode
  disabled?: boolean
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`flex justify-between py-2 px-4 border-primary-8 text-primary-6 h-10 ${
        disabled ? "opacity-60" : "cursor-pointer"
      } ${!underlineOff ? "border-b-[1px]" : ""}`}
    >
      <div className="flex gap-2 items-center justify-center ">
        <div>{icon}</div>
        <p>{text}</p>
      </div>
      {action}
    </div>
  )
}
