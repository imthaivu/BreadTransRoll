"use client";

import { Button } from "@/components/ui/Button";
import { Mic, Rotate3D, RotateCcw, Square, Trash2 } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useEffect, useMemo, useState } from "react";
import { SPEAKING_MAX_FILE_BYTES } from "../types";
import { Modal } from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface AudioRecorderProps {
  onRecordingComplete: (audioFile: File) => void;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  disabled,
}: AudioRecorderProps) {
  const {
    status,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const extension = useMemo(() => {
    if (!audioBlob) return "webm";
    const type = audioBlob.type;
    if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
    if (type.includes("ogg")) return "ogg";
    if (type.includes("wav")) return "wav";
    return "webm";
  }, [audioBlob]);

  useEffect(() => {
    if (audioBlob) {
      if (audioBlob.size > SPEAKING_MAX_FILE_BYTES) {
        setError("Bản ghi vượt quá 15MB. Vui lòng ghi lại ngắn hơn.");
        setAudioUrl(null);
        return;
      }
      setError(null);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      const audioFile = new File([audioBlob], `recording.${extension}`, {
        type: audioBlob.type || "audio/webm",
      });
      onRecordingComplete(audioFile);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioBlob, extension, onRecordingComplete]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    if (status === "recording") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {};
  }, [status]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      <div className="w-full flex flex-col items-center justify-center p-4 rounded-lg min-h-[200px] border-2 border-dashed border-gray-300 bg-gray-50">
        {status === "idle" && (
          <Button
            onClick={startRecording}
            disabled={disabled}
            size="lg"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mic className="w-5 h-5" />
            Bắt đầu ghi âm
          </Button>
        )}

        {status === "recording" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-2xl font-mono text-primary animate-pulse">
              {formatTime(duration)}
            </div>
            <Button
              onClick={stopRecording}
              size="md"
              variant="warning"
              className="flex items-center gap-2"
            >
              <Square className="w-5 h-5 bg-white" />
              Dừng ghi âm
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-400 font-medium text-center">
            {error}
          </div>
        )}

        {status === "stopped" && audioUrl && !error && (
          <div className="flex flex-col items-center gap-4 w-full">
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfirmReset(true)}
                size="md"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Ghi âm lại
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmReset}
        message="Cẩn thận bấm nhầm!! Bạn có chắc chắn muốn ghi âm lại không?"
        onClose={() => setShowConfirmReset(false)}
        onConfirm={() => {
          resetRecording();
          setShowConfirmReset(false);
        }}
        title="Xác nhận ghi âm lại"
      />
    </>
  );
}
