"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { FlashIcon, ShareModernIcon } from "@/app/components/icons";
import ProfileInfo from "./profileInfo";
import { useFollowStats } from "@/hooks/useFollowStats";
import { useLikeStat } from "@/hooks/useLikeStat";
import { useParams } from "next/navigation";
// import { useUser } from "@/hooks/useUser";
import useUserData, { prefetchUserData } from "@/hooks/useUserData";
import ProfileSkeleton from "./profileSkeleton";
import ModalWrapper from "../../components/modals/modalWrapper";
import EditModal from "./modals/editModal";
import DeleteModal from "./modals/deleteModal";
import EditProfileModal from "./modals/editProfileModal";
import ShareModal from "../../components/modals/shareModal";
import { useUser } from "@/hooks/useUser";
import Topup from "@/app/menu/topup";
import { useReadContract } from "thirdweb/react";
import { getContractInstance } from "@/utils";
import { torusTestnet } from "$/constants/chains";
import { formatEther } from "ethers";
import { useUpdateUserDetails } from "@/hooks/useUpdateUserDetails";
import { log, logError } from "@/utils/sentryUtils";
import OptimizedImage from "@/app/components/OptimizedImage";
import profileImage from "@/assets/images/profile.jpg";
import appConfig from "@/config";
import WalletButton from "@/app/components/walletButton";
// import { getUser } from "$/queries/user/getUser";

type TitleType = "Edit Account" | "Edit Profile" | "Delete Account" | "";

const unrealTokenContract = getContractInstance(
  torusTestnet,
  appConfig.blockchain.tokens.mainnet.torus.unreal
);

// Add this placeholder function at the top of the file, outside the component
// This is a placeholder - you would need to implement the actual function
const getFollowerIds = async (userId: string): Promise<string[]> => {
  // In a real implementation, you would fetch follower IDs from your API
  log(`Fetching followers for user ${userId}`);
  return []; // Return empty array for now
};

export default function UserData() {
  const [open, setOpen] = useState(false);
  const [topup, setTopup] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [title, setTitle] = useState<TitleType>("");

  const queryClient = useQueryClient();

  const params = useParams();
  const profileId = params.id as string;

  // Fetch data about the profile being viewed
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
    isOwnProfile,
    updateUserDataOptimistically,
  } = useUserData(profileId);

  // Get the current authenticated user's information
  const {
    userId: authUserId,
    user: authUser,
    loading: authUserLoading,
    refetchUser,
  } = useUser();

  // Get the update function for profile data
  //const { updateViewedProfile } = useUpdateUserDetails();

  //fetch follow stats
  const { followeeCount, followerCount } = useFollowStats(profileId);

  //fetch like stat
  const { data: likeCount } = useLikeStat(profileId);

  // credit
  const { data: unrealBalance, refetch } = useReadContract({
    contract: unrealTokenContract,
    method: "function balanceOf(address account) returns (uint256)",
    params: [authUser?.wallet?.address || ""],
  });

  // Prefetch related users when this profile is viewed
  useEffect(() => {
    if (profileData && followeeCount && followeeCount > 0) {
      // Prefetch followers data when available
      const prefetchFollowers = async () => {
        try {
          // Get follower IDs
          const followerIds = await getFollowerIds(profileId);
          // Prefetch the first 3-5 followers for better UX
          followerIds.slice(0, 5).forEach((followerId: string) => {
            prefetchUserData(queryClient, followerId);
          });
        } catch (error) {
          logError("Error prefetching followers", error);
        }
      };

      prefetchFollowers();
    }
  }, [profileId, followeeCount, queryClient, profileData]);

  // Example of how to use profile updates when it's the user's own profile
  // const updateProfileBio = async (newBio: string) => {
  //   if (!isOwnProfile || !profileId) return;

  //   // Optimistically update the UI
  //   updateUserDataOptimistically({
  //     bio: newBio,
  //   });

  //   // Then perform the actual update
  //   try {
  //     await updateViewedProfile(profileId, { bio: newBio });
  //   } catch (error) {
  //     const err = error as Error;
  //     logError("Failed to update bio", err);
  //     // The UI will automatically revert if the mutation fails
  //   }
  // };

  if (profileLoading || authUserLoading || !authUser)
    return <ProfileSkeleton />;
  if (profileError)
    return <p>Error loading profile data: {profileError.message}</p>;

  const showEditAccount = () => {
    // Only allow editing if it's the user's own profile
    if (!isOwnProfile) return;

    setOpen(true);
    setTitle("Edit Account");
  };

  const handleClose = () => {
    setOpen(false);
    setTitle("");
  };

  return (
    <>
      <div className="flex flex-col md:flex-row pt-5 w-full mb-12 gap-4">
        <div className="flex gap-4">
          <div className="w-28 h-28 md:w-52 md:h-52">
            <OptimizedImage
              className="rounded-full"
              src={profileData?.avatar_url || profileImage}
              width={200}
              height={200}
              alt={`${profileData?.full_name}'s profile picture`}
              trackPerformance={true}
              imageName={`profile-${profileId}`}
              isProfile={true}
              username={profileData?.full_name || profileData?.username || ""}
              isAvatar={true}
              isProfilePage={true}
            />
          </div>

          <div className="block md:hidden">
            <p className="text-3xl font-medium">{profileData?.full_name}</p>

            <div className="flex my-4 gap-3">
              {isOwnProfile && (
                <button
                  onClick={showEditAccount}
                  className="flex justify-center items-center h-9 w-28 text-primary-4 font-medium text-sm topup-btn-gradient rounded-2xl bg-primary-11"
                >
                  <p className="text-sm">Edit Account</p>
                </button>
              )}

              <button className="flex justify-center items-center h-9 w-12 text-primary-4 font-medium text-sm topup-btn-gradient rounded-2xl bg-primary-11">
                <ShareModernIcon width={16} height={16} color="#DADADA" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow text-primary-5">
          <div className="hidden md:block">
            <p className="text-3xl font-medium">{profileData?.full_name}</p>

            <div className="flex my-4 gap-3">
              {isOwnProfile && (
                <button
                  onClick={showEditAccount}
                  className="flex justify-center items-center h-9 w-28 text-primary-4 font-medium text-sm topup-btn-gradient rounded-2xl bg-primary-11"
                >
                  <p className="text-sm">Edit Account</p>
                </button>
              )}

              <button
                onClick={() => setOpenShare(true)}
                className="flex justify-center items-center h-9 w-12 text-primary-4 font-medium text-sm topup-btn-gradient rounded-2xl bg-primary-11"
              >
                <ShareModernIcon width={16} height={16} color="#DADADA" />
              </button>
            </div>
          </div>

          <div className="flex gap-x-4 my-4">
            <ProfileInfo
              value={followeeCount?.toString() || "0"}
              title={followeeCount === 1 ? "Follower" : "Followers"} // Adjusts title dynamically
            />
            <ProfileInfo
              value={followerCount?.toString() || "0"}
              title={followerCount === 1 ? "Following" : "Following"} // Stays the same
              leftBorder={true}
            />
            <ProfileInfo
              value={likeCount?.toString() || "0"}
              title={likeCount === 1 ? "Like" : "Likes"} // Adjusts title dynamically
              leftBorder={true}
            />
          </div>

          {profileData?.bio && <p className="text-primary-7 my-4"> Bio </p>}
          <p className="text-primary-7 my-4"> {profileData?.bio} </p>
        </div>

        <Topup open={topup} setOpen={setTopup} refetch={refetchUser} />

        <div className="hidden md:flex  h-fit gap-3">
          {isOwnProfile && (
            <button
              onClick={() => setTopup(true)}
              className="flex gap-2 whitespace-nowrap text-primary-4 font-medium text-sm topup-btn-gradient p-3 rounded-md bg-primary-11"
            >
              <p>
                {(() => {
                  return `${Number(
                    formatEther(unrealBalance ?? BigInt(0))
                  ).toFixed(2)} $UNREAL`;
                })()}
              </p>
            </button>
          )}

          <div className="hidden xl:flex">
            <WalletButton />
          </div>
        </div>
      </div>
      <ShareModal
        open={openShare}
        setOpen={setOpenShare}
        link={
          profileId
            ? "https://art.ideomind.org/home/profile/" + profileId
            : "https://art.ideomind.org/home"
        }
        isProfile={true}
      />
      <ModalWrapper
        title={title}
        open={open}
        setOpen={setOpen}
        titleColor={title === "Delete Account" ? "#FF5252" : undefined}
      >
        {title === "Edit Account" && (
          <EditModal
            openProfile={() => setTitle("Edit Profile")}
            deleteProfile={() => setTitle("Delete Account")}
          />
        )}
        {title === "Delete Account" && (
          <DeleteModal closeAction={handleClose} />
        )}
        {title === "Edit Profile" && profileData && (
          <EditProfileModal profileId={profileId} closeAction={handleClose} />
        )}
      </ModalWrapper>
    </>
  );
}
