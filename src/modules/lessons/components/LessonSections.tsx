import { FiPlay, FiCheckCircle, FiCircle } from "react-icons/fi";
import type { LessonDoc } from "../types";
import { useState } from "react";

interface LessonSectionsProps {
  lesson: LessonDoc;
  loading: boolean;
  onSectionView?: (sectionId: string) => void;
  userId?: string;
}

export function LessonSections({
  lesson,
  loading,
  onSectionView,
  userId,
}: LessonSectionsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
      // Mark section as viewed when expanded
      if (onSectionView) {
        onSectionView(sectionId);
      }
    }
    setExpandedSections(newExpanded);
  };

  const isSectionViewed = (sectionId: string): boolean => {
    if (!userId || !lesson.sectionViews) return false;
    return lesson.sectionViews[sectionId]?.includes(userId) || false;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Nội dung bài học
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-300 rounded mb-3 w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!lesson.sections || lesson.sections.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Nội dung bài học
        </h3>
        <div className="text-center py-8 text-gray-500">
          <FiPlay className="mx-auto text-3xl mb-2" />
          <p>Chưa có nội dung nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Nội dung bài học ({lesson.sections.length} sections)
      </h3>

      <div className="space-y-3">
        {lesson.sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.id);
          const isViewed = isSectionViewed(section.id);

          return (
            <div
              key={section.id}
              className={`border rounded-lg transition-all duration-200 ${
                isViewed
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isViewed ? (
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <FiCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {index + 1}. {section.title}
                    </div>
                    <div className="text-sm md:text-base text-gray-500">
                      {isViewed ? "Đã xem" : "Chưa xem"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FiPlay
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                  <div className="pt-4 prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {section.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
