"use client";

import { MiluLoading } from "@/components/ui/LoadingSpinner";
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
  const { role, signInWithGoogle, isGuest, session } = useAuth();
  const isNotLoggedIn = !session?.user;
  const isGuestAfterLogin = session?.user && role === "guest";

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
            <div className="text-center">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Ngữ pháp tiếng Anh 6 - 12
              </h1>
            </div>
          </StaggerItem>

          {isGuest && !isLoading && (
            <StaggerItem>
              <div className="text-center p-3 my-3 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg sm:p-4 sm:my-4">
              <p className="text-sm md:text-base text-yellow-800">
                {isGuestAfterLogin
                  ? "Vui lòng liên hệ BreadTrans để kích hoạt tài khoản"
                  : "Bạn đang xem 1 phần bài học. Tham gia để truy cập trọn vẹn!"}
              </p>
            </div>
            </StaggerItem>
          )}

          <StaggerItem>
            <div>
              {isLoading || isFetching ? (
                <MiluLoading text="Chờ xíu... Milu đang chuẩn bị bảo bối..." />
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
