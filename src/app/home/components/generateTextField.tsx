"use client";
import { useCreateJob } from "@/hooks/useCreateJob";
//import { useRouter } from "next/navigation";
import { supabase } from "$/supabase/client";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import Topup from "@/app/menu/topup";
import { useReadContract } from "thirdweb/react";
import { getContractInstance } from "@/utils";
import { torusTestnet } from "$/constants/chains";
import { formatEther } from "ethers";
import { toast } from "sonner";
import appConfig from "@/config";

interface GenerateTextFieldProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
const dartContract = getContractInstance(
  torusTestnet,
  appConfig.blockchain.contracts.dart
);

export default function GenerateTextField({
  open,
  setOpen,
}: GenerateTextFieldProps) {
  const { user, refetchUser } = useUser();
  const { mutate, isGenerating, progress, cancelJob } = useCreateJob(user);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [topup, setTopup] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const { data: dartBalance, refetch } = useReadContract({
    contract: dartContract,
    method: "function balanceOf(address account) returns (uint256)",
    params: [user?.wallet?.address || ""],
  });

  const generate = async () => {
    if (!prompt?.trim()) {
      toast.error("Please provide a prompt.");
      return;
    }

    // if (
    //   (user?.creditBalance ?? 0) +
    //     Number(formatEther(dartBalance ?? BigInt(0))) <
    //   1
    // ) {
    //   toast.error("Credit balance too low.");
    //   return;
    // }

    setShowProgress(true);

    mutate(
      { prompt },
      {
        onSuccess: () => {
          setShowProgress(false);
          handleClose();
        },
        onError: (error) => {
          setShowProgress(false);
          toast.error(`Error generating image: ${error.message}`);
        },
      }
    );
  };

  const cancelGeneration = () => {
    cancelJob();
    setShowProgress(false);
    toast.info("Image generation canceled");
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!open) return;
  return (
    <>
      <div
        onClick={handleClose}
        className="fixed z-[9000] top-0 left-0 h-screen w-full"
      ></div>

      <div className="absolute flex justify-center z-[9000] top-0 left-0 h-screen w-full">
        <div
          onClick={handleClose}
          className="absolute z-[9000] top-0 left-0 h-screen w-full"
        ></div>

        <div className="absolute z-[9001] md:mt-20 w-full md:w-8/12 max-w-[924px] h-5/6 md:h-[432px] rounded-md border-primary-8 border-[1px] p-3 bg-primary-12">
          <div className="flex z-[9002] flex-col bg-primary-13 h-full w-full rounded-md">
            <div className="flex-grow">
              <textarea
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-inherit w-full h-full resize-none outline-none p-4 text-primary-8 placeholder:text-primary-8"
              ></textarea>
            </div>

            <div className="h-14 p-2 w-full flex justify-end border-t-[1px] border-primary-11 gap-2">
              <button
                onClick={handleClose}
                className="basis-1/12 text-primary-5 border-primary-11 border-[1px] font-semibold rounded-full px-6"
              >
                Close
              </button>

              <Topup open={topup} setOpen={setTopup} refetch={refetchUser} />

              {/* {(user?.creditBalance ?? 0) < 1 && (
                <button
                  onClick={() => setTopup(true)}
                  className="basis-1/6 text-primary-11 bg-primary-5 font-semibold whitespace-nowrap rounded-full px-6"
                >
                  Top Up
                </button>
              )} */}

              {/* {(user?.creditBalance ?? 0) >= 1 && ( */}
              <button
                onClick={generate}
                className="basis-1/6 text-primary-11 bg-primary-5 font-semibold rounded-full px-6"
              >
                Generate
              </button>
              {/* )} */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
