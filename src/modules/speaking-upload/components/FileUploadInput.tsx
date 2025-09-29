"use client";

import { useRef, useState } from "react";
import { SPEAKING_MAX_FILE_BYTES } from "../types";

interface FileUploadInputProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled: boolean;
}

export const FileUploadInput = ({
  selectedFile,
  onFileSelect,
  disabled,
}: FileUploadInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > SPEAKING_MAX_FILE_BYTES) {
        setError("Kích thước file vượt quá 15MB.");
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError(null);
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-lg">
      <label
        htmlFor="file-upload"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Tải lên tệp âm thanh (MP3/WebM/OGG/WAV)
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload-input"
              className={`relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>Tải lên một file</span>
              <input
                id="file-upload-input"
                name="file-upload-input"
                type="file"
                className="sr-only"
                accept=".mp3,.webm,.ogg,.wav,audio/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={disabled}
              />
            </label>
            <p className="pl-1">hoặc kéo và thả</p>
          </div>
          <p className="text-xs text-gray-500">
            Chấp nhận MP3, WebM, OGG, WAV. Tối đa 15MB.
          </p>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </div>
      </div>
      {selectedFile && (
        <div className="mt-3 flex justify-between items-center bg-gray-50 p-2 rounded-md">
          <p className="text-sm text-gray-700 truncate">{selectedFile.name}</p>
          <button
            onClick={handleRemoveFile}
            className="text-red-600 hover:text-red-800 text-sm font-semibold"
            disabled={disabled}
          >
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};
