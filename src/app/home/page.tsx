"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TabBtn from "./components/tabBtn";
import GenerateInput from "./components/generateInput";
import dynamic from "next/dynamic";
import Search from "./components/search";
import Skeleton from "react-loading-skeleton";
import PostsProvider from "./components/PostsProvider";
import { createClient } from "$/supabase/client";
import { updateUserTorusId } from "@/queries/torus";
import { ErrorBoundary } from "../components/errorBoundary";

// Dynamically import PhotoGallery with proper loading state
const PhotoGallary = dynamic(() => import("./components/photoGallery"), {
  ssr: false, // Changed to false since it uses browser-only APIs
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
      {Array(15)
        .fill(null)
        .map((_, index) => (
          <Skeleton
            key={index}
            height={200}
            baseColor="#1a1a1a"
            highlightColor="#333"
            className="rounded-lg"
          />
        ))}
    </div>
  ),
});

export default function HomePage() {
  const searchParams = useSearchParams();
  const searchType = searchParams?.get("s") || "";
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're running on the client
    setIsClient(true);

    const checkTorusUser = async () => {
      try {
        // Only try to access localStorage in the client environment
        if (typeof window !== "undefined") {
          const torusUser = localStorage.getItem("torusUser");
          if (torusUser) {
            // Update user
            await updateUserTorusId(torusUser);
          }
        }
      } catch (error) {
        console.error("Error checking Torus user:", error);
        // Gracefully handle the error instead of crashing
      }
    };

    checkTorusUser();
  }, []);

  return (
    <PostsProvider searchType={searchType}>
      <div className="relative flex flex-col items-center background-color-primary-1 px-1 md:px-10 w-full">
        <div className="hidden md:flex flex-col justify-center items-center pt-5 w-full">
          <GenerateInput />
        </div>
        <div className="flex gap-x-2 items-center w-full h-10 mt-3 md:mt-0 mb-2 relative overflow-x-auto">
          <Search />
          <Suspense
            fallback={
              <div className="rounded-full px-4 py-2 text-sm md:text-base font-medium text-primary-6 bg-opacity-0">
                Explore
              </div>
            }
          >
            <TabBtn text="Explore" />
          </Suspense>
          <Suspense
            fallback={
              <div className="rounded-full px-4 py-2 text-sm md:text-base font-medium text-primary-6 bg-opacity-0 whitespace-nowrap">
                Featured Mints
              </div>
            }
          >
            <TabBtn text="Featured Mints" />
          </Suspense>
          <Suspense
            fallback={
              <div className="rounded-full px-4 py-2 text-sm md:text-base font-medium text-primary-6 bg-opacity-0">
                Following
              </div>
            }
          >
            <TabBtn text="Following" />
          </Suspense>

          <Suspense
            fallback={
              <div className="rounded-full px-4 py-2 text-sm md:text-base font-medium text-primary-6 bg-opacity-0">
                Feed
              </div>
            }
          >
            <TabBtn text="Feed" />
          </Suspense>
        </div>
        <div className="overflow-y-auto w-full">
          {isClient && (
            <ErrorBoundary
              componentName="Photo Gallery"
              fallback={
                <div className="flex flex-col items-center justify-center w-full py-8">
                  <p className="text-center text-lg text-primary-6 mb-4">
                    Unable to load gallery
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary-8 hover:bg-primary-7 text-white rounded-md transition-colors"
                  >
                    Reload Gallery
                  </button>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
                    {Array(15)
                      .fill(null)
                      .map((_, index) => (
                        <Skeleton
                          key={index}
                          height={200}
                          baseColor="#1a1a1a"
                          highlightColor="#333"
                          className="rounded-lg animate-pulse"
                        />
                      ))}
                  </div>
                }
              >
                <PhotoGallary />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </div>
    </PostsProvider>
  );
}
