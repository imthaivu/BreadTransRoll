"use client";

import { GrammarTopic } from "@/constants/grammar";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface TopicSelectorProps {
  topics: GrammarTopic[];
  onTopicSelect: (topic: GrammarTopic) => void;
  className?: string;
}

export default function TopicSelector({
  topics,
  onTopicSelect,
  className = "",
}: TopicSelectorProps) {
  if (topics.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-full p-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-600 mb-2">
            Chưa có chủ đề nào
          </h4>
          <p className="text-gray-500">Đang tải dữ liệu ngữ pháp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {topics.map((topic, index) => (
          <motion.div
            className="relative cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            key={topic.id}
            onClick={() => onTopicSelect(topic)}
          >
            <div className="relative h-[100px] overflow-hidden rounded-lg p-2 shadow-sm group-hover:shadow-md transition-all duration-200 border-2 border-gray-200 bg-white">
              {/* Topic icon */}
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-3 mx-auto">
                <BookOpen className="w-4 h-4 text-white" />
              </div>

              {/* Topic title */}
              <h4 className="text-sm md:text-base font-semibold text-center mb-1 line-clamp-2 text-gray-800">
                {index + 1}. {topic.title}
              </h4>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all duration-200" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
