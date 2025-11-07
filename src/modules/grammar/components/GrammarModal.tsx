"use client";

import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { GrammarTopic } from "@/constants/grammar";
import { useAuth } from "@/lib/auth/context";
import { UserRole } from "@/lib/auth/types";
import { MagicDoor } from "@/modules/home/components";
import { motion } from "framer-motion";
import { ExternalLink, Lock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface GrammarModalProps {
  topic: GrammarTopic | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GrammarModal({
  topic,
  isOpen,
  onClose,
}: GrammarModalProps) {
  const { isGuest, session } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showMagicDoor, setShowMagicDoor] = useState(false);
  const router = useRouter();

  const handleClickWatchVideo = (videoUrl: string, index: number) => {
    if (session?.user?.role === UserRole.GUEST && index > 0) {
      setShowUpgradePrompt(true);
      return;
    }

    if (isGuest && index > 0) {
      setShowLoginPrompt(true);
      return;
    }

    if (!videoUrl) {
      toast.error("Video đang được cập nhật");
      return;
    }

    window.open(videoUrl, "_blank");
  };

  if (!topic) return null;

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title={topic.title}
        subtitle={`${topic.exercises.length} bài tập có sẵn`}
      >
        <div>
          {/* Exercises List */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {topic.exercises.map((exercise, index) => {
              const isLocked = isGuest && index > 0;
              return (
                <motion.div
                  key={`${topic.id}-${exercise.exerciseNo}-${exercise.subNo}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm md:text-base font-semibold px-3 py-1 rounded">
                          Bài {exercise.exerciseNo}
                          {exercise.subNo && `.${exercise.subNo}`}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-gray-800 line-clamp-2">
                        {exercise.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() =>
                          handleClickWatchVideo(exercise?.video, index)
                        }
                        variant={isLocked ? "secondary" : "primary"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {isLocked ? "Bị khoá" : "Xem video"}
                        {!isLocked && <ExternalLink className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm md:text-base text-gray-500">
                Tổng cộng {topic.exercises.length} bài tập
              </p>
              <Button onClick={onClose} variant="secondary">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onConfirm={() => {
          setShowLoginPrompt(false);
          setShowMagicDoor(true);
        }}
        title="Yêu cầu tham gia"
        message="Bạn cần tham gia để xem được nội dung này. Bạn có muốn tham gia ngay bây giờ không?"
        confirmText="Tham gia"
        cancelText="Để sau"
      />

      <ConfirmDialog
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onConfirm={() => {
          setShowUpgradePrompt(false);
        }}
        title="Yêu cầu nâng cấp"
        message="Bạn cần nâng cấp tài khoản để xem được nội dung này. Hãy liên hệ Admin Breadtrans để được kích hoạt tài khoản."
        confirmText="Xác nhận"
        cancelText="Để sau"
      />

      <MagicDoor
        isOpen={showMagicDoor}
        onClose={() => setShowMagicDoor(false)}
        onLogin={() => {}}
      />
    </>
  );
}
