"use client";

import { useState, useRef, useEffect } from 'react';

interface EnhancedVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  playsInline?: boolean;
  startTime?: number;
  controls?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
}

/**
 * Enhanced Video Player with YouTube-like controls
 * 
 * A customized video player with elegant controls, smooth playback,
 * and responsive design. Supports Cloudflare-hosted videos.
 */
export default function EnhancedVideoPlayer({
  src,
  poster,
  title,
  className = '',
  autoPlay = false,
  loop = false,
  muted = false,
  crossOrigin = 'anonymous',
  playsInline = true,
  startTime,
  controls = true,
  onEnded,
  onPlay,
  onPause,
  onTimeUpdate
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle SSR
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Set start time if provided
    if (startTime && startTime > 0) {
      video.currentTime = startTime;
    }
    
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };
    
    const onTimeUpdateHandler = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
      if (onTimeUpdate) onTimeUpdate(video.currentTime);
    };
    
    const onPlayHandler = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };
    
    const onPauseHandler = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };
    
    const onEndedHandler = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    
    const onVolumeChange = () => {
      setVolume(video.volume);
    };
    
    const onWaiting = () => {
      setLoading(true);
    };
    
    const onCanPlay = () => {
      setLoading(false);
    };
    
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdateHandler);
    video.addEventListener('play', onPlayHandler);
    video.addEventListener('pause', onPauseHandler);
    video.addEventListener('ended', onEndedHandler);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdateHandler);
      video.removeEventListener('play', onPlayHandler);
      video.removeEventListener('pause', onPauseHandler);
      video.removeEventListener('ended', onEndedHandler);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
    };
  }, [onPlay, onPause, onEnded, onTimeUpdate, startTime]);
  
  // Handle auto-hide controls
  useEffect(() => {
    if (isClient && controls) {
      const handleMouseMove = () => {
        setShowControls(true);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (isPlaying) {
          timeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isClient, controls, isPlaying]);
  
  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };
  
  // Handle seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = duration * pos;
    
    videoRef.current.currentTime = seekTime;
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  
  // Only render on client-side to avoid hydration issues
  if (!isClient) {
    return <div className={`w-full ${className}`} />;
  }
  
  return (
    <div className={`enhanced-video-player relative rounded-lg overflow-hidden ${className}`}>
      {/* Main video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        crossOrigin={crossOrigin}
        playsInline={playsInline}
        preload="metadata"
        onClick={togglePlay}
        controls={false}
      />
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
          <div className="w-12 h-12 border-4 border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Custom controls */}
      {controls && showControls && (
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-transparent via-transparent to-black/70 transition-opacity duration-300 z-20">
          {/* Center play button (shown only when paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
              >
                <svg className="w-8 h-8 ml-1" viewBox="0 0 24 24" fill="#000">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Bottom controls */}
          <div className="p-4 pt-10 space-y-2">
            {/* Progress bar */}
            <div 
              className="h-1.5 bg-white bg-opacity-30 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                {/* Play/pause button */}
                <button onClick={togglePlay} className="focus:outline-none">
                  {isPlaying ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                
                {/* Time display */}
                <div className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                
                {/* Volume control (only on larger screens) */}
                <div className="hidden sm:flex items-center gap-2">
                  <button onClick={() => {
                    if (!videoRef.current) return;
                    videoRef.current.muted = !videoRef.current.muted;
                  }}>
                    {muted || volume === 0 ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-white"
                  />
                </div>
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center gap-4">
                {title && <span className="hidden md:block text-sm font-medium opacity-80">{title}</span>}
                
                {/* Fullscreen button */}
                <button onClick={toggleFullscreen} className="focus:outline-none">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
