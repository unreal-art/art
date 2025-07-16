"use client";
import { CloseIcon, CollaspeIcon, ExpandIcon } from "@/app/components/icons";
import { MD_BREAKPOINT } from "@/app/libs/constants";
import { useGenerationStore } from "@/app/providers/GenerationStoreProvider";
import appConfig from "@/config/appConfig";
import { useEffect, useState } from "react";

export default function GenerationProgress() {
  const { isActive, stopGeneration } = useGenerationStore((state) => state);

  const [expand, setExpand] = useState(false);
  const [size, setSize] = useState(
    typeof window !== "undefined" && window.innerWidth < MD_BREAKPOINT
      ? 16
      : 24,
  );
  const [timeLeft, setTimeLeft] = useState(appConfig.ai.genImageLatency);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setSize(window.innerWidth < MD_BREAKPOINT ? 16 : 24);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(appConfig.ai.genImageLatency); // Reset countdown
      setIsFinishing(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsFinishing(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? `0${secs}` : secs}`;
  };

  if (!isActive) return null; // Don't auto-hide, but remove when inactive

  return (
    <div className="fixed z-50 bottom-20 md:bottom-4 right-4 md:right-16 rounded-xl max-w-[496px] w-4/5 bg-primary-13">
      <div className="flex items-center justify-between h-12 md:h-[84px] px-5 text-sm md:text-2xl text-primary-6">
        <p>
          {isFinishing
            ? "Finishing up..."
            : `Generating image(s) ${formatTime(timeLeft)} left...`}
        </p>

        <div className="flex gap-x-2">
          <button onClick={() => setExpand(!expand)}>
            {expand ? (
              <CollaspeIcon color="#C1C1C1" width={size} height={size} />
            ) : (
              <ExpandIcon color="#C1C1C1" width={size} height={size} />
            )}
          </button>
          <button onClick={() => stopGeneration()}>
            <CloseIcon color="#C1C1C1" width={size} height={size} />
          </button>
        </div>
      </div>

      {expand && (
        <>
          <hr className="border-primary-9 mx-3" />
          <div className="p-3">
            <div className="h-60 md:h-80 generate-gradient rounded-[4px]"></div>
          </div>
        </>
      )}
    </div>
  );
}
