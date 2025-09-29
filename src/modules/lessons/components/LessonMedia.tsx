import { FiPlay, FiPause, FiVolume2, FiVolumeX } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import type { LessonDoc } from "../types";
import { getMediaTypeIcon } from "../utils";

interface LessonMediaProps {
  lesson: LessonDoc;
  loading: boolean;
}

export function LessonMedia({ lesson, loading }: LessonMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const mediaIcon = getMediaTypeIcon(lesson.mediaType);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener("timeupdate", updateTime);
    media.addEventListener("loadedmetadata", updateDuration);
    media.addEventListener("ended", handleEnded);

    return () => {
      media.removeEventListener("timeupdate", updateTime);
      media.removeEventListener("loadedmetadata", updateDuration);
      media.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    if (!media) return;

    const time = parseFloat(e.target.value);
    media.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Media Player
        </h3>
        <div className="aspect-video bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-4xl">{mediaIcon}</div>
        </div>
      </div>
    );
  }

  if (!lesson.mediaUrl) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Media Player
        </h3>
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">{mediaIcon}</div>
            <p>Không có media</p>
          </div>
        </div>
      </div>
    );
  }

  const isVideo = lesson.mediaType === "video";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Player</h3>

      <div className="relative">
        {/* Media Element */}
        <div
          className={`${
            isVideo ? "aspect-video" : "aspect-square"
          } bg-black rounded-lg overflow-hidden`}
        >
          {isVideo ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={lesson.mediaUrl}
              className="w-full h-full object-contain"
              poster=""
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={lesson.mediaUrl}
                className="w-full"
              />
              <div className="text-center text-white">
                <div className="text-6xl mb-4">{mediaIcon}</div>
                <p className="text-lg">{lesson.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isPlaying ? (
                <FiPause className="w-5 h-5 text-white" />
              ) : (
                <FiPlay className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Time Display */}
            <div className="text-white text-sm md:text-base font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                    (currentTime / duration) * 100
                  }%, rgba(255,255,255,0.2) ${
                    (currentTime / duration) * 100
                  }%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
            </div>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isMuted ? (
                <FiVolumeX className="w-5 h-5 text-white" />
              ) : (
                <FiVolume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Media Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{mediaIcon}</span>
          <span className="font-medium text-gray-900">
            {lesson.mediaType === "video" ? "Video" : "Audio"}
          </span>
        </div>
        <p className="text-sm md:text-base text-gray-600">{lesson.mediaUrl}</p>
      </div>
    </div>
  );
}
