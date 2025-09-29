import { LESSON_TABS } from "../constants";

interface LessonTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function LessonTabs({ activeTab, onTabChange }: LessonTabsProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2 mb-8 border border-gray-200/50 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {LESSON_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
