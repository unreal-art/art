"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import "./video-player-styles.css"

export interface EnhancedVideoPlayerProps {
  src: string
  className?: string
  title?: string
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  startTime?: number
  crossOrigin?: "anonymous" | "use-credentials" | ""
  controls?: boolean
  playsInline?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
}

export default function EnhancedVideoPlayer({
  src,
  className = "",
  title,
  poster,
  autoPlay = true,
  loop = true,
  muted = true,
  startTime = 0,
  crossOrigin = "anonymous",
  controls = true,
  playsInline = true,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
}: EnhancedVideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Format time (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Hide controls after inactivity
  useEffect(() => {
    if (!isClient || !isPlaying || !showControls) return

    const timer = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, showControls, isClient])

  // Client-side only initialization
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Client-side only effect for start time
  useEffect(() => {
    if (videoRef.current && startTime && startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime, isClient]);

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
      if (onTimeUpdate) onTimeUpdate(video.currentTime)
    }
    
    const onPlayHandler = () => {
      setIsPlaying(true)
      if (onPlay) onPlay()
    }
    
    const onPauseHandler = () => {
      setIsPlaying(false)
      if (onPause) onPause()
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

    // Simple error logging
    const onError = (e: Event) => {
      console.error("Video error occurred:", e)
    }

    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("timeupdate", onTimeUpdateHandler)
    video.addEventListener("play", onPlayHandler)
    video.addEventListener("pause", onPauseHandler)
    video.addEventListener("ended", onEndedHandler)
    video.addEventListener("volumechange", onVolumeChange)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("canplay", onCanPlay)
    video.addEventListener("error", onError)

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("timeupdate", onTimeUpdateHandler)
      video.removeEventListener("play", onPlayHandler)
      video.removeEventListener("pause", onPauseHandler)
      video.removeEventListener("ended", onEndedHandler)
      video.removeEventListener("volumechange", onVolumeChange)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("canplay", onCanPlay)
      video.removeEventListener("error", onError)
    }
  }, [onEnded, onPause, onPlay, onTimeUpdate, startTime])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    const newMutedState = !isMuted
    videoRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }, [isMuted])

  // Handle volume change
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return
      const newVolume = parseFloat(e.target.value)
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      if (newVolume === 0) {
        videoRef.current.muted = true
        setIsMuted(true)
      } else if (isMuted) {
        videoRef.current.muted = false
        setIsMuted(false)
      }
    },
    [isMuted]
  )

  // Handle seeking through the video
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return

      const progressBar = e.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      const seekTime = pos * videoRef.current.duration

      videoRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
    },
    []
  )

  // Toggle fullscreen
  const toggleFullScreen = useCallback(() => {
    if (!playerRef.current || !isClient) return

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }, [isClient])

  // Update fullscreen state
  useEffect(() => {
    if (!isClient) return

    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [isClient])

  // Show controls on mouse movement
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
  }, [])

  return (
    <div 
      ref={playerRef}
      className={`enhanced-video-player ${className}`}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        crossOrigin={crossOrigin}
        className="enhanced-video-player-video"
        onClick={togglePlay}
      />

      {isClient && (
        <div className="enhanced-video-player-overlay">
          {/* Loading spinner */}
          {isLoading && (
            <div className="loading-spinner-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}

          {/* Bottom gradient overlay */}
          <div className="bottom-gradient-overlay"></div>

          {/* Video controls (shown conditionally) */}
          {controls && (
            <div className={`video-controls-container ${showControls ? 'visible' : 'hidden'}`}>
              {/* Progress bar */}
              <div className="progress-bar-container" onClick={handleSeek}>
                <div className="progress-bar-background">
                  <div 
                    className="progress-bar-filled" 
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Main controls wrapper */}
              <div className="main-controls-container">
                {/* Left side controls */}
                <div className="left-controls">
                  {/* Play/pause button */}
                  <button
                    onClick={togglePlay}
                    className="control-button"
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
                    onClick={toggleFullScreen}
                    className="focus:outline-none hover:scale-110 transition-transform"
                  >
                    {isFullScreen ? (
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
          )}
        </div>
      )}
    </div>
  )
}
