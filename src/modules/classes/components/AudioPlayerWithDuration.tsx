"use client";

import { estimateAudioDuration } from "@/utils/audio";
import { useEffect, useRef, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";

interface AudioPlayerWithDurationProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPlayerWithDuration({
  src,
  autoPlay = false,
  className = "",
}: AudioPlayerWithDurationProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(
    null
  );

  // Estimate duration when component mounts or src changes
  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    estimateAudioDuration(src)
      .then((estimated) => {
        setEstimatedDuration(estimated);
        setDuration(estimated);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [src]);

  // Set up audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      const audioDuration = audio.duration;
      // Use actual duration if available, otherwise use estimated
      if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      } else if (estimatedDuration) {
        setDuration(estimatedDuration);
      }
    };

    const handleLoadedMetadata = () => {
      updateDuration();
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      updateTime();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Set source
    audio.src = src;
    audio.preload = "metadata";

    // Auto play if requested
    if (autoPlay) {
      audio.play().catch((error) => {
        console.warn("Autoplay prevented:", error);
      });
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src, autoPlay, estimatedDuration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <audio ref={audioRef} />
      
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover: bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <FiPause className="w-5 h-5" />
          ) : (
            <FiPlay className="w-5 h-5 ml-0.5" />
          )}
        </button>

        {/* Time display */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-[100px]">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={!duration || isLoading}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: duration
              ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  (currentTime / duration) * 100
                }%, #e5e7eb ${
                  (currentTime / duration) * 100
                }%, #e5e7eb 100%)`
              : undefined,
          }}
        />
      </div>
    </div>
  );
}

