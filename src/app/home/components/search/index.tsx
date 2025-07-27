"use client";
import { useState, Suspense, useEffect, useRef } from "react";
import { CloseIcon, SearchIcon } from "@/app/components/icons";
import Tabs from "./searchTab";
import SearchPhotoGallary from "./searchPhotoGallary";
import UserSearch from "./userSearch";
import { ErrorBoundary } from "@/app/components/errorBoundary";
import { useDebounce } from "use-debounce";
import Skeleton from "react-loading-skeleton";

export default function Search() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  
  // Reference for autofocusing input when modal opens
  const searchInputRef = useRef<HTMLInputElement>(null);

  function getIconColor() {
    if (hover) {
      return "#8F8F8F";
    } else {
      return "#5D5D5D";
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      
      // Close search with Escape
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);
  
  // Focus input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure the modal is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <>
      <button
        className={`flex gap-x-1 h-9 w-10 items-center justify-center rounded-full ${
          hover ? "bg-primary-10" : ""
        }`}
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Search"
        title="Search (Cmd+K)"
      >
        <SearchIcon width={16} height={16} color={getIconColor()} />
      </button>

      {open && (
        <div className="fixed z-50   top-0  h-full w-screen bg-gray-950/50">
          <div
            onClick={() => setOpen(false)}
            className="m-auto z-50  top-0 left-0 h-screen w-screen bg-gray-950/50"
          ></div>

          <div 
            className="absolute w-full max-w-[1034px] overflow-hidden h-[90vh] z-50 top-2 md:top-[5vh] left-0 md:left-60 border-primary-8 border-[1px] bg-primary-12 rounded-xl p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-dialog-title"
          >
            <div className="flex justify-between text-primary-3">
              <p className="nasalization text-2xl" id="search-dialog-title">
                Search for Anything Imaginable
              </p>
              <div className="cursor-pointer" onClick={() => setOpen(false)}>
                <CloseIcon width={24} height={24} color="#C1C1C1" />
              </div>
            </div>

            <div>
              <div className="relative h-14 w-full my-3 rounded-xl bg-primary-10">
                <button className="absolute top-[18px] left-3 z-10">
                  <SearchIcon width={20} height={20} color="#8F8F8F" />
                </button>

                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for anything imaginable"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="absolute text-primary-2 placeholder:text-primary-2 bg-inherit left-0 top-0 w-full h-14 px-10 rounded-lg border-[1px] border-primary-11 border-none focus:outline-none focus:ring-1 focus:ring-primary-5"
                  aria-label="Search input"
                  autoComplete="off"
                  // Close on Escape key
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setOpen(false);
                    }
                  }}
                />
              </div>
            </div>

            <div className="my-2">
              <Tabs
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
              />
            </div>

            <div className="overflow-y-auto h-[70vh] ">
              {currentIndex === 0 && (
                <ErrorBoundary
                  fallback={(
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <p className="text-xl text-primary-3 mb-4">Unable to load user search results</p>
                      <button 
                        className="px-4 py-2 bg-primary-5 text-white rounded-lg hover:bg-primary-6 transition-colors"
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                >
                  <Suspense fallback={
                    <div className="space-y-4">
                      {Array(5).fill(null).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Skeleton circle width={40} height={40} baseColor="#1a1a1a" highlightColor="#333" />
                          <div className="flex-1">
                            <Skeleton width={120} height={20} baseColor="#1a1a1a" highlightColor="#333" />
                            <Skeleton width={80} height={16} baseColor="#1a1a1a" highlightColor="#333" />
                          </div>
                        </div>
                      ))}
                    </div>
                  }>
                    <UserSearch searchTerm={debouncedSearch} />
                  </Suspense>
                </ErrorBoundary>
              )}

              {currentIndex === 1 && (
                <ErrorBoundary
                  fallback={(
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <p className="text-xl text-primary-3 mb-4">Unable to load photo search results</p>
                      <button 
                        className="px-4 py-2 bg-primary-5 text-white rounded-lg hover:bg-primary-6 transition-colors"
                        onClick={() => window.location.reload()}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                >
                  <Suspense fallback={
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Array(9).fill(null).map((_, index) => (
                        <Skeleton 
                          key={index} 
                          height={180} 
                          className="rounded-lg" 
                          baseColor="#1a1a1a" 
                          highlightColor="#333" 
                        />
                      ))}
                    </div>
                  }>
                    <SearchPhotoGallary searchTerm={debouncedSearch} />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
