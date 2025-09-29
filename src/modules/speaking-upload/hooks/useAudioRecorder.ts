"use client";

import { useState, useRef, useEffect } from "react";

export type RecordingStatus = "idle" | "recording" | "paused" | "stopped";

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const chooseSupportedMimeType = (): string | undefined => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mpeg",
    ];
    for (const type of candidates) {
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).MediaRecorder &&
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    }
    return undefined;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = chooseSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || chunks[0]?.type || "audio/webm";
        const blob = new Blob(chunks, { type: finalType });
        setAudioBlob(blob);
        setStatus("stopped");
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };

      recorder.start();
      setStatus("recording");
      setDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setStatus("idle");
    setDuration(0);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    status,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
