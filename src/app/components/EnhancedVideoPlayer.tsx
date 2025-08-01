"use client"

import React, { useEffect, useRef, useState } from "react"
import "./video-player-styles.css"

interface EnhancedVideoPlayerProps {
  src: string
  poster?: string
  title?: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  crossOrigin?: "anonymous" | "use-credentials"
  playsInline?: boolean
  startTime?: number
  controls?: boolean
  onEnded?: () => void
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (time: number) => void
}

/**
 * Enhanced Video Player with elegant UI
 *
 * A custom video player with modern controls, smooth playback,
 * and responsive design. Optimized for Cloudflare-hosted videos.
 */
export default function EnhancedVideoPlayer({
  src,
  poster,
  title,
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
  crossOrigin = "anonymous",
  playsInline = true,
  startTime,
  controls = true,
  onEnded,
  onPlay,
  onPause,
  onTimeUpdate,
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Handle SSR
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set start time if provided
    if (startTime && startTime > 0) {
      video.currentTime = startTime
    }

    const onLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const onTimeUpdateHandler = () => {
      setCurrentTime(video.currentTime)
      const progress = (video.currentTime / video.duration) * 100
      if (onTimeUpdate) onTimeUpdate(video.currentTime)
    }

    const onPlayHandler = () => {
      setIsPlaying(true)
    }

    const onPauseHandler = () => {
      setIsPlaying(false)
    }

    const onEndedHandler = () => {
      setIsPlaying(false)
      if (onEnded) onEnded()
    }

    const onVolumeChange = () => {
      setVolume(video.volume)
    }

    const onWaiting = () => {
      setIsLoading(true)
    }

    const onCanPlay = () => {
      setIsLoading(false)
    }

    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("timeupdate", onTimeUpdateHandler)
    video.addEventListener("play", onPlayHandler)
    video.addEventListener("pause", onPauseHandler)
    video.addEventListener("ended", onEndedHandler)
    video.addEventListener("volumechange", onVolumeChange)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("canplay", onCanPlay)

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("timeupdate", onTimeUpdateHandler)
      video.removeEventListener("play", onPlayHandler)
      video.removeEventListener("pause", onPauseHandler)
      video.removeEventListener("ended", onEndedHandler)
      video.removeEventListener("volumechange", onVolumeChange)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("canplay", onCanPlay)
    }
  }, [onPlay, onPause, onEnded, onTimeUpdate, startTime])

  // Handle auto-hide controls
  useEffect(() => {
    if (isClient && controls) {
      const handleMouseMove = () => {
        setShowControls(true)

        // Clear existing timeout
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current)
        }

        // Only start the hide timer if video is playing
        if (isPlaying) {
          hideControlsTimerRef.current = setTimeout(() => {
            setShowControls(false)
          }, 3000)
        }
      }

      // Set up mouse move event listener
      const playerElement = playerRef.current
      if (playerElement) {
        playerElement.addEventListener("mousemove", handleMouseMove)
        return () => {
          if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current)
          }
          playerElement.removeEventListener("mousemove", handleMouseMove)
        }
      }
    }
  }, [isClient, controls, isPlaying])

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width

    videoRef.current.currentTime = pos * duration
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const newVolume = parseFloat(e.target.value)
    videoRef.current.volume = newVolume
    setVolume(newVolume)
  }

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return
    const newMutedState = !isMuted
    videoRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!playerRef.current) return

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Only render on client-side to avoid hydration issues
  if (!isClient) {
    return <div className={`w-full ${className}`} />
  }

  return (
    <div
      ref={playerRef}
      className={`enhanced-player-container relative ${className} overflow-hidden rounded-lg`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain bg-black"
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        crossOrigin={crossOrigin}
        playsInline={playsInline}
        onClick={controls ? togglePlay : undefined}
      />

      {/* Controls overlay - only shown when controls prop is true */}
      {isClient && controls && (
        <div
          className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
          onMouseMove={() => setShowControls(true)}
        >
          {/* Top gradient overlay */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-16 h-16 flex items-center justify-center">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          )}

          {/* Big play button (shown when paused) */}
          {!isLoading && !isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              onClick={togglePlay}
            >
              <button className="w-16 h-16 bg-white bg-opacity-75 rounded-full flex items-center justify-center focus:outline-none transition-transform transform hover:scale-110">
                <svg
                  className="w-8 h-8 text-gray-900"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}

          {/* Bottom controls bar with gradient background */}
          <div className="relative z-10 w-full">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            <div className="relative p-4 pt-10 space-y-2">
              {/* Progress bar */}
              <div
                className="group relative h-1.5 bg-white/30 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div
                  className="absolute -top-1 h-3.5 w-3.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `calc(${(currentTime / duration) * 100}% - 6px)`,
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  {/* Play/pause button */}
                  <button
                    onClick={togglePlay}
                    className="focus:outline-none hover:scale-110 transition-transform"
                  >
                    {isPlaying ? (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Time display */}
                  <div className="text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Volume control (only on larger screens) */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="focus:outline-none hover:scale-110 transition-transform"
                    >
                      {isMuted || volume === 0 ? (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      ) : volume < 0.5 ? (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 accent-white range-slider"
                    />
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-4">
                  {title && (
                    <span className="hidden md:block text-sm font-medium opacity-80">
                      {title}
                    </span>
                  )}

                  {/* Fullscreen button */}
                  <button
                    onClick={toggleFullscreen}
                    className="focus:outline-none hover:scale-110 transition-transform"
                  >
                    {isFullscreen ? (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
