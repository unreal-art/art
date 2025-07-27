"use client";
import { IPhoto } from "@/app/libs/interfaces";
import Image from "next/image";
import { ExtendedPhoto } from "../formattedPhotos";
import useAuthorUsername from "@/hooks/useAuthorUserName";
import useAuthorImage from "@/hooks/useAuthorImage";
import CommentArea from "./comments/commentArea";
import { useRef, useState, useEffect } from "react";
import OptimizedImage from "@/app/components/OptimizedImage";
import { startSpan } from "@/utils/sentryUtils";

interface GenerateTextFieldProps {
  photo: boolean | IPhoto;
  setImageIndex: (value: number) => void;
}

export default function ImageView({
  photo,
  setImageIndex,
}: GenerateTextFieldProps) {
  const currentImage = photo as ExtendedPhoto;
  const authorId = currentImage.author || "";
  const { data: userName, isLoading } = useAuthorUsername(authorId);
  const { data: image, isLoading: imageLoading } = useAuthorImage(authorId);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement | null>(null);

  // Track how long it takes for the image to become visible in the viewport
  useEffect(() => {
    const finishSpan = startSpan(
      `image-visibility-${
        currentImage.src?.split("/").pop()?.split("?")[0] || "unknown"
      }`,
      "image-visibility",
      { imageUrl: currentImage.src },
    );

    // Use Intersection Observer to detect when image enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsImageVisible(true);
            observer.disconnect();
            finishSpan();
          }
        });
      },
      { threshold: 0.1 }, // Trigger when 10% of the image is visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
      finishSpan(); // Clean up the span if component unmounts before visible
    };
  }, [currentImage.src]);

  const handleClose = () => {
    setImageIndex(-1);
  };

  if (!photo) return;

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed z-50 h-dvh   top-0 left-0   w-full bg-gray-950/50 inset-0"
      ></div>

      <div className="fixed z-50 flex justify-center items-center top-0 left-0 h-dvh  w-full ">
        <div
          onClick={handleClose}
          className="absolute flex justify-center items-center top-0 left-0 h-dvh  w-full "
        ></div>

        <div className="z-10 w-full md:w-11/12 xl:w-8/12 max-w-[968px] h-dvh  md:h-[643px] rounded-md border-primary-8 border-[1px] p-3 bg-primary-12">
          <div className="bg-primary-13 h-full w-full rounded-md">
            <div className="grid grid-cols-1 h-full md:grid-cols-2">
              <div className="h-full col-span-1 hidden md:block">
                <div className="relative w-full md:h-full">
                  {currentImage.media_type === 'VIDEO' ? (
                    <video
                      src={currentImage.src}
                      controls
                      controlsList="nodownload"
                      className="object-cover w-full h-full rounded-md"
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <OptimizedImage
                      src={currentImage.src}
                      alt={currentImage.caption || "Image"}
                      width={450}
                      height={450}
                      quality={75}
                      priority={false}
                      trackPerformance={true}
                      imageName={
                        currentImage.src?.split("/").pop()?.split("?")[0]
                      }
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
              </div>

              <div className="h-full ">
                <CommentArea
                  image={image as string}
                  imageLoading={imageLoading}
                  userName={userName as string}
                  isLoading={isLoading}
                  authorId={authorId}
                  postId={currentImage.id}
                  imageDetails={currentImage}
                  handleClose={handleClose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
