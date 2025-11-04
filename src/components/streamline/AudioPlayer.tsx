"use client";

import { Button } from "@/components/ui/Button";
import { AUDIO_PLAYER_CONFIG } from "@/constants/streamline";
import { Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { saveListeningProgress } from "@/modules/listening/services";
import { useAuth } from "@/lib/auth/context";

interface AudioPlayerProps {
  audioFiles: string[];
  onLessonSelect?: (index: number) => void;
  currentLesson?: number;
  className?: string;
  missingLessons?: number[];
  trackingContext?: {
    module: string; // "streamline" | "lessons1000"
    itemKey: string; // e.g., book id or composite key
  };
}

export default function AudioPlayer({
  audioFiles,
  onLessonSelect,
  currentLesson = 0,
  className = "",
  missingLessons = [],
  trackingContext,
}: AudioPlayerProps) {
  const { session } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(currentLesson);
  const playbackRateRef = useRef(playbackRate);
  const [maxPercent, setMaxPercent] = useState(0);
  const [submittedThisSession, setSubmittedThisSession] = useState(false);
  const submittedRef = useRef(false);

  const handleResetProgressTracking = useCallback(() => {
    setSubmittedThisSession(false);
    submittedRef.current = false;
    setMaxPercent(0);
  }, []);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.playbackRate = playbackRateRef.current;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration > 0) {
        const percent =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setMaxPercent((prev) => Math.max(prev, percent));
      }
    }
  }, []);

  const handlePlaying = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("playing", handlePlaying);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);
      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("playing", handlePlaying);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlaying,
    handlePause,
    handleEnded,
  ]);

  useEffect(() => {
    setSelectedLesson(currentLesson);
  }, [currentLesson]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioFiles[selectedLesson]) {
      const newSrc = audioFiles[selectedLesson];
      if (audio.getAttribute("src") !== newSrc) {
        audio.src = newSrc;
        audio.load();
        setMaxPercent(0);
        setSubmittedThisSession(false);
        submittedRef.current = false;
      }
    }
  }, [selectedLesson, audioFiles]);

  // Submit when crossing threshold (70%) once per session per audio
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid || !trackingContext) return;
    if (submittedThisSession || submittedRef.current) return;
    if (duration <= 0) return;
    if (maxPercent < 70) return;

    const audioId = String(selectedLesson + 1);
    submittedRef.current = true;
    setSubmittedThisSession(true);
    saveListeningProgress({
      studentId: uid,
      module: trackingContext.module,
      itemKey: trackingContext.itemKey,
      audioId,
      durationSeconds: duration,
      maxProgressPercent: maxPercent,
    })
      .then(() => {
        // no-op
      })
      .catch((e) => {
        console.error("saveListeningProgress error", e);
        // allow retry on failure
        submittedRef.current = false;
        setSubmittedThisSession(false);
      });
  }, [
    maxPercent,
    duration,
    trackingContext,
    session?.user?.id,
    selectedLesson,
    submittedThisSession,
  ]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      // Reset progress tracking if playing from the start, for re-listens
      // Allow a small buffer (20%) to account for slight delays in setting currentTime
      if (audio.currentTime < (duration * 20) / 100 || audio.ended) {
        handleResetProgressTracking();
      }
      try {
        await audio.play();
      } catch (error) {
        console.error("Audio play failed:", error);
      }
    }
  };

  const handleLessonSelect = (index: number) => {
    if (index !== selectedLesson) {
      setSelectedLesson(index);
      onLessonSelect?.(index);
      setPlaybackRate(1);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      if (audioRef.current) {
        audioRef.current.playbackRate = 1;
      }
    }
  };

  const handleSeek = (seconds: number) => {
    if (audioRef.current && duration > 0) {
      const newTime = audioRef.current.currentTime + seconds;
      const finalTime = Math.max(0, Math.min(newTime, duration));
      audioRef.current.currentTime = finalTime;

      // If seeking back towards the beginning, reset progress tracking for re-listens
      if (finalTime < 1 && seconds < 0) {
        handleResetProgressTracking();
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && duration > 0) {
      const newTime = (Number(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
      // If user seeks back to the beginning, reset progress tracking
      if (newTime < 1) {
        handleResetProgressTracking();
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${className}`}>
      <audio ref={audioRef} preload="metadata" />

      {audioFiles.length > 0 ? (
        <>
          <div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={handleProgressChange}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
            <Button
              onClick={() => handleSeek(-10)}
              variant="ghost"
              className="w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <SkipBack className="w-7 h-7" /> 5s
            </Button>

            <Button
              onClick={handlePlayPause}
              className="w-12 h-10 rounded-full bg-primary text-white shadow-lg hover:scale-105 transform transition-transform duration-300"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-1" />
              )}
            </Button>

            <Button
              onClick={() => handleSeek(10)}
              variant="ghost"
              className="w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              5s <SkipForward className="w-7 h-7" />
            </Button>
          </div>

          <div className="flex justify-center items-center gap-6 mb-8 px-2">
            <div className="flex items-center gap-2">
              {AUDIO_PLAYER_CONFIG.speeds.map((speed) => (
                <Button
                  key={speed}
                  onClick={() => {
                    setPlaybackRate(speed);
                    if (audioRef.current) audioRef.current.playbackRate = speed;
                  }}
                  variant={playbackRate === speed ? "primary" : "secondary"}
                  size="sm"
                  className={`w-10 h-7 rounded-lg text-sm md:text-base font-bold flex items-center justify-center gap-1 ${
                    playbackRate === speed
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>
                    {
                      AUDIO_PLAYER_CONFIG.speedIcons[
                        speed as keyof typeof AUDIO_PLAYER_CONFIG.speedIcons
                      ]
                    }
                  </span>
                  <span>{speed}x</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-16 gap-1">
            {audioFiles.map((_, index) => {
              if (missingLessons.includes(index + 1)) {
                return null;
              }

              return (
                <Button
                  key={index}
                  onClick={() => handleLessonSelect(index)}
                  variant={selectedLesson === index ? "primary" : "secondary"}
                  size="sm"
                  className={`aspect-square w-full h-auto rounded-xl text-lg font-bold transition-all duration-200 ${
                    selectedLesson === index
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200"
                  }`}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-full">
              <Music className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <h4 className="text-xl font-semibold text-gray-600 mb-2">
            Chưa có bài học nào
          </h4>
          <p className="text-gray-500">Hãy chọn sách để bắt đầu học</p>
        </div>
      )}

      <style jsx>{
        /* css */ `
          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6; /* blue-600 */
            cursor: pointer;
            border: 4px solid white;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease;
          }
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 4px solid white;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
          }
        `
      }</style>
    </div>
  );
}
