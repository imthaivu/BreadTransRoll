// Lessons module constants
export const LESSON_MEDIA_TYPES = {
  VIDEO: "video",
  AUDIO: "audio",
} as const;

export const LESSON_MEDIA_TYPE_LABELS = {
  [LESSON_MEDIA_TYPES.VIDEO]: "Video",
  [LESSON_MEDIA_TYPES.AUDIO]: "Audio",
} as const;

export const LESSON_MEDIA_TYPE_ICONS = {
  [LESSON_MEDIA_TYPES.VIDEO]: "🎥",
  [LESSON_MEDIA_TYPES.AUDIO]: "🎵",
} as const;

export const LESSON_SORT_OPTIONS = [
  { value: "createdAt", label: "Ngày tạo" },
  { value: "title", label: "Tên bài học" },
  { value: "views", label: "Lượt xem" },
] as const;

export const LESSON_SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Mới nhất" },
  { value: "asc", label: "Cũ nhất" },
] as const;

export const LESSON_MEDIA_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: LESSON_MEDIA_TYPES.VIDEO, label: "Video" },
  { value: LESSON_MEDIA_TYPES.AUDIO, label: "Audio" },
] as const;

export const LESSON_ACTIONS = {
  VIEW: "view",
  EDIT: "edit",
  DELETE: "delete",
  DUPLICATE: "duplicate",
} as const;

export const LESSON_ACTION_LABELS = {
  [LESSON_ACTIONS.VIEW]: "Xem",
  [LESSON_ACTIONS.EDIT]: "Chỉnh sửa",
  [LESSON_ACTIONS.DELETE]: "Xóa",
  [LESSON_ACTIONS.DUPLICATE]: "Sao chép",
} as const;

export const LESSON_ACTION_ICONS = {
  [LESSON_ACTIONS.VIEW]: "👁️",
  [LESSON_ACTIONS.EDIT]: "✏️",
  [LESSON_ACTIONS.DELETE]: "🗑️",
  [LESSON_ACTIONS.DUPLICATE]: "📋",
} as const;

export const LESSON_PERMISSIONS = {
  VIEW_LESSON: "view_lesson",
  EDIT_LESSON: "edit_lesson",
  DELETE_LESSON: "delete_lesson",
  CREATE_LESSON: "create_lesson",
  MANAGE_SECTIONS: "manage_sections",
} as const;

export const LESSON_TABS = [
  { id: "overview", label: "Tổng quan", icon: "📊" },
  { id: "sections", label: "Nội dung", icon: "📚" },
  { id: "media", label: "Media", icon: "🎥" },
  { id: "progress", label: "Tiến độ", icon: "📈" },
] as const;

export const LESSON_FORM_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  SECTIONS_MIN_COUNT: 1,
  SECTIONS_MAX_COUNT: 50,
} as const;

export const LESSON_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/ogg"],
  ALLOWED_AUDIO_TYPES: ["audio/mp3", "audio/wav", "audio/ogg"],
  UPLOAD_PATH_PREFIX: "lessons",
} as const;
