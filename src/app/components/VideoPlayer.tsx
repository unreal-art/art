"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, ExpandIcon, VolumeIcon, Volume2Icon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoHideControls?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  controlsList?: string;
  preload?: string;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  className = "",
  autoHideControls = true,
  loop = false,
  muted = false,
  showControls = true,
  controlsList = "nodownload",
  preload = "metadata",
  onEnded,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format time in MM:SS format
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      onPause?.();
    } else {
      videoRef.current.play();
      onPlay?.();
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return;
    
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const seekPosition = (e.clientX - progressRect.left) / progressRect.width;
    const seekTime = duration * seekPosition;
    
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle progress bar hover
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    
    const progressRect = progressBarRef.current.getBoundingClientRect();
    const hoverPos = (e.clientX - progressRect.left) / progressRect.width;
    setHoverPosition(hoverPos);
    setHoverTime(duration * hoverPos);
  };

  // Handle progress bar mouse leave
  const handleProgressLeave = () => {
    setHoverPosition(null);
    setHoverTime(null);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Auto-hide controls when playing
  useEffect(() => {
    const hideControls = () => {
      if (autoHideControls && isPlaying) {
        setIsControlsVisible(false);
      }
    };

    const showControls = () => {
      setIsControlsVisible(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      if (autoHideControls && isPlaying) {
        controlsTimeoutRef.current = setTimeout(hideControls, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', showControls);
      container.addEventListener('touchstart', showControls);
    }

    if (autoHideControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(hideControls, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (container) {
        container.removeEventListener('mousemove', showControls);
        container.removeEventListener('touchstart', showControls);
      }
    };
  }, [autoHideControls, isPlaying]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Set up video event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const onLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnded) onEnded();
    };

    const onVolumeChange = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
    videoElement.addEventListener('timeupdate', onTimeUpdate);
    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', onPause);
    videoElement.addEventListener('ended', onEnded);
    videoElement.addEventListener('volumechange', onVolumeChange);
    videoElement.addEventListener('waiting', onWaiting);
    videoElement.addEventListener('canplay', onCanPlay);

    return () => {
      videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.removeEventListener('timeupdate', onTimeUpdate);
      videoElement.removeEventListener('play', onPlay);
      videoElement.removeEventListener('pause', onPause);
      videoElement.removeEventListener('ended', onEnded);
      videoElement.removeEventListener('volumechange', onVolumeChange);
      videoElement.removeEventListener('waiting', onWaiting);
      videoElement.removeEventListener('canplay', onCanPlay);
    };
  }, [onEnded]);

  return (
    <div 
      ref={containerRef}
      className={clsx(
        "relative overflow-hidden bg-black rounded-lg group",
        className
      )}
      onDoubleClick={toggleFullscreen}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload={preload}
        loop={loop}
        muted={isMuted}
        playsInline
        className="w-full h-full object-contain"
        controlsList={controlsList}
      />

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (
        <AnimatePresence>
          {isControlsVisible && (
            <motion.div 
              className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/40 via-transparent to-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Top controls */}
              <div className="p-4 flex justify-end">
                {/* Title or additional controls could go here */}
              </div>

              {/* Center play/pause button */}
              <div className="flex-1 flex items-center justify-center" onClick={togglePlay}>
                {!isPlaying && (
                  <motion.button
                    className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlayIcon className="w-10 h-10 text-white ml-1" />
                  </motion.button>
                )}
              </div>

              {/* Bottom controls */}
              <div className="p-4 space-y-2">
                {/* Progress bar and timestamp */}
                <div 
                  className="relative h-1 bg-white/30 rounded cursor-pointer group"
                  onClick={handleSeek}
                  onMouseMove={handleProgressHover}
                  onMouseLeave={handleProgressLeave}
                  ref={progressBarRef}
                >
                  {/* Progress indicator */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-white rounded"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />

                  {/* Hover indicator */}
                  {hoverPosition !== null && (
                    <div 
                      className="absolute top-0 h-full bg-white/50 rounded"
                      style={{ 
                        left: 0,
                        width: `${hoverPosition * 100}%`,
                        pointerEvents: 'none' 
                      }}
                    />
                  )}
                  
                  {/* Scrubber handle */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{ 
                      left: `${(currentTime / duration) * 100}%`,
                      transform: 'translateX(-50%) translateY(-50%)'
                    }}
                  />
                  
                  {/* Hover timestamp tooltip */}
                  {hoverTime !== null && (
                    <div 
                      className="absolute bottom-3 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded pointer-events-none"
                      style={{ 
                        left: `${hoverPosition * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Play/pause and time */}
                  <div className="flex items-center space-x-3">
                    <button onClick={togglePlay} className="text-white hover:text-gray-300">
                      {isPlaying ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* Time display */}
                    <div className="text-white text-xs">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  
                  {/* Right side controls */}
                  <div className="flex items-center space-x-3">
                    {/* Volume control */}
                    <div className="hidden sm:flex items-center space-x-1">
                      <button onClick={toggleMute} className="text-white hover:text-gray-300">
                        {isMuted || volume === 0 ? (
                          <VolumeIcon className="w-5 h-5" />
                        ) : (
                          <Volume2Icon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="relative w-16 h-1 group">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                        />
                        <div className="absolute inset-0 bg-white/30 rounded">
                          <div 
                            className="absolute top-0 left-0 h-full bg-white rounded"
                            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Fullscreen toggle */}
                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-300">
                      <ExpandIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
