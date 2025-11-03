"use client";

import { DoraemonLoading } from "@/components/ui/LoadingSpinner";
import PageMotion, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/PageMotion";
import { GrammarTopic, fetchGrammarData } from "@/constants/grammar";
import { useAuth } from "@/lib/auth/context";
import { GrammarModal, TopicSelector } from "@/modules/grammar";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function GrammarPage() {
  const { role, signInWithGoogle, isGuest } = useAuth();

  const {
    data: topics,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["grammarTopics"],
    queryFn: fetchGrammarData,
    initialData: [],
  });

  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTopicSelect = (topic: GrammarTopic) => {
    setSelectedTopic(topic);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTopic(null);
  };

  return (
    <PageMotion showLoading={false}>
      <div className="bg-white">
        <StaggerContainer>
          <StaggerItem>
            <div className="text-center pt-4 mb-4 sm:pt-8 sm:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Ngữ pháp tiếng Anh 6 - 12
              </h1>
            </div>
          </StaggerItem>

          {isGuest && !isLoading && (
            <StaggerItem>
              <div className="text-center p-4 my-4 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm md:text-base text-yellow-800">
                  Bạn đang xem trước với tư cách khách (giới hạn 6 chủ đề).{" "}
                  <button
                    onClick={signInWithGoogle}
                    className="font-semibold underline hover:text-yellow-900"
                  >
                    Đăng nhập
                  </button>{" "}
                  để truy cập không giới hạn!
                </p>
              </div>
            </StaggerItem>
          )}

          <StaggerItem>
            <div>
              {isLoading || isFetching ? (
                <DoraemonLoading text="Chờ xíu... Doraemon đang chuẩn bị bảo bối..." />
              ) : (
                <TopicSelector
                  topics={topics}
                  onTopicSelect={handleTopicSelect}
                />
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Grammar Modal */}
      <GrammarModal
        topic={selectedTopic}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageMotion>
  );
}
