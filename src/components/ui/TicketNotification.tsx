"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaTicketAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface TicketNotificationProps {
  show: boolean;
  onDismiss: () => void;
  avatarPosition?: { x: number; y: number };
}

export function TicketNotification({
  show,
  onDismiss,
  avatarPosition,
}: TicketNotificationProps) {
  const router = useRouter();

  const handleClick = () => {
    onDismiss();
    router.push("/spin-dorayaki");
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Speech bubble pointing from avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: avatarPosition?.x || 0, y: avatarPosition?.y || 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="fixed top-20 right-4 md:right-8 z-50 max-w-xs cursor-pointer"
            style={{
              transformOrigin: avatarPosition 
                ? `${avatarPosition.x}px ${avatarPosition.y}px`
                : "top right",
            }}
            onClick={handleClick}
          >
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl p-4 border-2 border-orange-600 hover:from-yellow-300 hover:to-orange-400 transition-all">
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking close
                  onDismiss();
                }}
                className="absolute top-2 right-2 text-orange-800 hover:text-orange-900 transition-colors z-10"
                aria-label="Đóng thông báo"
              >
                <FiX className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="flex items-start gap-3 pr-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className="flex-shrink-0"
                >
                  <FaTicketAlt className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm md:text-base leading-relaxed">
                    Bạn gì ơi có vé quay bánh mì kìa! 🎉
                  </p>
                </div>
              </div>

              {/* Tail pointing to avatar */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-orange-500 transform rotate-45 border-r-2 border-b-2 border-orange-600"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

