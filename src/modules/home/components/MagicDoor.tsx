"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/context";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import "./MagicDoor.css";

interface MagicDoorProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (studentId: string) => void;
}

// Animation variants - moved outside component to avoid recreation on each render
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: -50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const doraemonVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.4,
      duration: 0.6,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.6,
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10,
    },
  },
  tap: { scale: 0.95 },
};

const emojiVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.8 + i * 0.1,
      duration: 0.5,
    },
  }),
};

export default function MagicDoor({
  isOpen,
  onClose,
  onLogin,
}: MagicDoorProps) {
  const { session, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [showShine, setShowShine] = useState(false);
  const [showShineBorder, setShowShineBorder] = useState(false);
  const [showAdventureButton, setShowAdventureButton] = useState(false);
  const [showMiluMessage, setShowMiluMessage] = useState(false);
  const [showDoorAdventureButton, setShowDoorAdventureButton] = useState(false);
  const [showPopupBlockedMessage, setShowPopupBlockedMessage] = useState(false);
  const [showReopenButton, setShowReopenButton] = useState(false);

  // Effect to trigger door animation when modal opens
  useEffect(() => {
    if (isOpen) {
      // Trigger shine effect first
      setShowShine(true);
    } else {
      // When modal closes, if adventure button was shown, show it on door
      if (showAdventureButton) {
        setShowDoorAdventureButton(true);
      }
      // Reset modal states when modal closes
      setDoorOpen(false);
      setShowShine(false);
      setShowShineBorder(false);
      setShowAdventureButton(false);
      setShowMiluMessage(false);
    }
  }, [isOpen, showAdventureButton]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // New: NextAuth Google login
      await signInWithGoogle();

      // Close all modals
      onClose();
      setShowDoorAdventureButton(false);
      setShowMiluMessage(false);
      setShowAdventureButton(false);
    } catch (error: unknown) {
      console.error("NextAuth Google login failed:", error);
      // Old Firebase login flow (kept for reference)
      // try {
      //   await signInWithRedirect(getFirebaseAuth(), new GoogleAuthProvider());
      // } catch (fbErr) {
      //   console.error("Fallback Firebase redirect failed:", fbErr);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopenFunMessage = () => {
    setShowMiluMessage(true);
    setShowAdventureButton(true);
    setShowReopenButton(false);
  };

  const handleDoorClick = async () => {
    if (!doorOpen) {
      setDoorOpen(true);

      // Trigger shine border effect
      setShowShineBorder(true);

      // Play door opening sound and wait for it to finish
      const doorSound = new Audio(
        "https://magical-tulumba-581427.netlify.app/mp3-ui/mo-cua.mp3"
      );
      
      await new Promise<void>((resolve) => {
        doorSound.addEventListener("ended", () => {
          resolve();
        });
        doorSound.play().catch(console.error);
      });

      // After door sound finishes (5s), proceed to login
      handleGoogleLogin();
    }
  };

  return (
    <>
      {/* Magic Door Animation - No Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[9998] bg-white"
              onClick={onClose}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            {/* Door Container */}
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Floating Emojis Around Door */}
              <div className="absolute inset-0 pointer-events-none">
                {["📚", "🎵", "🎯", "🏆", "🎁", "✨", "⭐", "🌟"].map(
                  (emoji, index) => (
                    <motion.div
                      key={index}
                      className="absolute text-2xl"
                      style={{
                        left: `${20 + index * 10}%`,
                        top: `${10 + (index % 3) * 30}%`,
                      }}
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2 + index * 0.5,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                    >
                      {emoji}
                    </motion.div>
                  )
                )}
              </div>
              {/* Door with Enhanced Styling */}
              <div className="door-container relative">
                <div
                  className={`door ${doorOpen ? "open" : ""} ${
                    showShineBorder ? "shine-border" : ""
                  } ${!doorOpen ? "door-pulse" : ""}`}
                  onClick={handleDoorClick}
                >
                  <div className="door-handle"></div>

                  {/* Door Content - Preview */}
                  {!doorOpen && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <motion.div
                        className="text-white font-bold text-sm md:text-base leading-tight flex flex-col"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="mb-5 text-[#1E40AF] text-xl md:text-xl">
                          Mở “Cánh cửa thần kỳ”
                        </div>
                        <div className=" text-[#1E3A8A] text-xl md:text-xl">
                          Mở “Tương lai của bạn”
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>

                <div className="login-form">
                  {showShine && <div className="shine-effect"></div>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fun Message -  Only show after  teacher audio */}
      <AnimatePresence>
        {showMiluMessage && (
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-yellow-100 border-4 border-yellow-300 rounded-2xl p-6 text-center shadow-2xl max-w-[calc(100vw-40px)] w-[500px]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => {
                  setShowMiluMessage(false);
                  setShowAdventureButton(false);
                  setShowDoorAdventureButton(true);
                  setShowReopenButton(true);
                }}
                variant="ghost"
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✖
              </Button>
            </motion.div>

            <motion.div
              className="flex items-center justify-center mb-4"
              variants={doraemonVariants}
              initial="hidden"
              animate="visible"
            >
              <Image
                src={"/assets/images/doraemon-1.png"}
                alt="Milu"
                width={120}
                height={120}
              />
            </motion.div>

            <motion.p
              className="text-lg font-bold text-yellow-800 mb-4"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              &quot;Hãy cùng Milu khám phá tiếng Anh nhé!&quot;
            </motion.p>

            <AnimatePresence>
              {showAdventureButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{
                    delay: 0.2,
                    type: "spring" as const,
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button
                      onClick={() => {
                        handleGoogleLogin();
                        setShowReopenButton(false);
                      }}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span className="text-sm md:text-base">
                            Đang mở cửa thần kỳ...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-xl">🚀</div>
                          <span className="text-lg">Bắt đầu phiêu lưu!</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adventure Button on Door - Show when modal is closed but adventure button was triggered */}
      <AnimatePresence>
        {!isOpen && showDoorAdventureButton && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowDoorAdventureButton(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            {/* Adventure Button */}
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-yellow-100 border-4 border-yellow-300 rounded-2xl p-6 text-center shadow-2xl max-w-[calc(100vw-40px)] w-[500px]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Close */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={() => setShowDoorAdventureButton(false)}
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✖
                </Button>
              </motion.div>

              <motion.div
                className="flex items-center justify-center mb-4"
                variants={doraemonVariants}
                initial="hidden"
                animate="visible"
              >
                <Image
                  src={"/assets/images/doraemon-1.png"}
                  alt="Milu"
                  width={120}
                  height={120}
                />
              </motion.div>

              <motion.p
                className="text-lg font-bold text-yellow-800 mb-4"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                &quot;Hãy cùng Milu khám phá tiếng Anh nhé!&quot;
              </motion.p>

              <motion.div
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={() => {
                    handleGoogleLogin();
                    setShowReopenButton(false);
                  }}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="text-sm md:text-base">
                        Đang mở cửa thần kỳ...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-xl">🚀</div>
                      <span className="text-lg">Bắt đầu phiêu lưu!</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Popup Blocked Message */}
      <AnimatePresence>
        {showPopupBlockedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{
              type: "spring" as const,
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-4 right-4 z-[9999] bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 shadow-lg max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚫</div>
              <div>
                <h4 className="font-bold text-yellow-800 text-sm md:text-base">
                  Popup bị chặn!
                </h4>
                <p className="text-xs text-yellow-700">
                  Vui lòng cho phép popup để tham gia
                </p>
              </div>
              <button
                onClick={() => setShowPopupBlockedMessage(false)}
                className="text-yellow-600 hover:text-yellow-800 text-lg"
              >
                ✖
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
