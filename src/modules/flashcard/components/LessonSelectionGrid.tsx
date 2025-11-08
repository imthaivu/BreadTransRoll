import { Button } from "@/components/ui/Button";

interface Lesson {
  value: string;
  label: string;
}

interface LessonSelectionGridProps {
  lessons: Lesson[];
  selectedLessons: number[];
  completedLessons: number[];
  onSelectLesson: (lesson: number) => void;
  onClose: () => void;
}

export const LessonSelectionGrid = ({
  lessons,
  selectedLessons,
  completedLessons,
  onSelectLesson,
  onClose,
}: LessonSelectionGridProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto p-2">
        {lessons.map((lesson) => {
          const lessonNum = Number(lesson.value);
          const isSelected = selectedLessons.includes(lessonNum);
          const isCompleted = completedLessons.includes(lessonNum);

          let buttonClass =
            "p-2 w-full text-center rounded-md border text-sm font-medium transition-all ";

          if (isSelected) {
            buttonClass += " bg-primary text-white border-blue-600";
          } else if (isCompleted) {
            buttonClass += "bg-green-100 text-green-800 border-green-300";
          } else {
            buttonClass +=
              "bg-white text-gray-700 border-gray-300 hover:bg-gray-100";
          }

          return (
            <button
              key={lesson.value}
              onClick={() => onSelectLesson(lessonNum)}
              className={buttonClass}
            >
              {lesson.value}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600">
          Đã chọn: {selectedLessons.length} lessons
        </div>
        <Button onClick={onClose}>Đóng</Button>
      </div>
    </div>
  );
};
