"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { FiMessageCircle, FiPhone, FiX, FiChevronUp } from "react-icons/fi";

export default function ContactPopup() {
  const [isExpanded, setIsExpanded] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const openZaloChat = () => {
    window.open("https://zalo.me/0377180010", "_blank");
  };

  const callPhone = () => {
    window.open("tel:0377180010", "_self");
  };

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded) {
        const target = event.target as Element;
        // Check if click is outside both popup and button
        if (
          popupRef.current &&
          buttonRef.current &&
          !popupRef.current.contains(target) &&
          !buttonRef.current.contains(target)
        ) {
          setIsExpanded(false);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <>
      {/* Main Popup */}
      {/* Toggle Button - Always visible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          ref={buttonRef}
          onClick={toggleExpanded}
          className="bg-gradient-to-r bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isExpanded ? <FiX size={24} /> : <FiMessageCircle size={24} />}
          </motion.div>

          {/* Pulse animation - chỉ hiển thị khi đóng */}
          {!isExpanded && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
          )}
        </button>

        {/* Floating text - chỉ hiển thị khi đóng */}
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 3 }}
            className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-200 text-black px-3 py-1 rounded-lg text-sm whitespace-nowrap"
          >
            Liên hệ ngay!
            <div className="absolute right-[-4px] top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-200 rotate-45"></div>
          </motion.div>
        )}
      </motion.div>

      {/* Popup Content - Positioned separately */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 min-w-[280px] max-w-[320px]"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <FiMessageCircle className="text-primary" size={16} />
              </div>
              <h3 className="font-semibold text-gray-800">Liên hệ ngay</h3>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {/* Zalo Contact */}
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/images/zalo.png"
                    alt="Zalo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Zalo</p>
                    <p className="text-sm text-gray-600">0377180010</p>
                    <p className="text-xs text-gray-500">Vũ Quốc Thái</p>
                  </div>
                  <button
                    onClick={openZaloChat}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Chat
                  </button>
                </div>
              </div>

              {/* Phone Contact */}
              <div className="bg-green-50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiPhone className="text-green-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Điện thoại</p>
                    <p className="text-sm text-gray-600">0377180010</p>
                  </div>
                  <button
                    onClick={callPhone}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Gọi
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
