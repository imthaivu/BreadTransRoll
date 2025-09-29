import { useState, useRef } from "react";
import { FiUpload, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import type { LessonFormData, LessonSection } from "../types";
import { generateSectionId, validateLessonForm } from "../utils";

interface LessonFormProps {
  initialData?: Partial<LessonFormData>;
  onSubmit: (data: LessonFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function LessonForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Tạo bài học",
}: LessonFormProps) {
  const [formData, setFormData] = useState<LessonFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    mediaType: initialData?.mediaType || "video",
    mediaUrl: initialData?.mediaUrl || "",
    sections: initialData?.sections || [],
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof LessonFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleAddSection = () => {
    const newSection: LessonSection = {
      id: generateSectionId(),
      title: "",
      content: "",
    };
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleSectionChange = (
    index: number,
    field: keyof LessonSection,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (file: File) => {
    // This would typically upload to Firebase Storage
    // For now, we'll just simulate the upload
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setFormData((prev) => ({
            ...prev,
            mediaUrl: URL.createObjectURL(file),
          }));
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateLessonForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin cơ bản
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Tiêu đề bài học *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập tiêu đề bài học"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập mô tả bài học"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              Loại media *
            </label>
            <select
              value={formData.mediaType}
              onChange={(e) =>
                handleInputChange(
                  "mediaType",
                  e.target.value as "video" | "audio"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
              URL Media *
            </label>
            <input
              type="url"
              value={formData.mediaUrl}
              onChange={(e) => handleInputChange("mediaUrl", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nhập URL media hoặc upload file"
            />
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept={formData.mediaType === "video" ? "video/*" : "audio/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />

            <Button
              type="button"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <FiUpload />
              {uploading ? `Uploading... ${uploadProgress}%` : "Upload File"}
            </Button>
          </div>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Nội dung bài học ({formData.sections.length} sections)
          </h3>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddSection}
            className="flex items-center gap-2"
          >
            <FiPlus />
            Thêm Section
          </Button>
        </div>

        <div className="space-y-4">
          {formData.sections.map((section, index) => (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Section {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveSection(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <FiTrash2 />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                    Tiêu đề section *
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      handleSectionChange(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập tiêu đề section"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                    Nội dung section *
                  </label>
                  <textarea
                    value={section.content}
                    onChange={(e) =>
                      handleSectionChange(index, "content", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nhập nội dung section"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ))}

          {formData.sections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>
                Chưa có section nào. Nhấn &quot;Thêm Section&quot; để bắt đầu.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Có lỗi xảy ra:</h4>
          <ul className="list-disc list-inside text-sm md:text-base text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <FiSave />
          {loading ? "Đang lưu..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
