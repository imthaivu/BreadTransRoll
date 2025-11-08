"use client";
import { useAuth } from "@/lib/auth/context";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTodaySpinTickets, subscribeTodaySpinTickets } from "@/modules/spin-dorayaki/services";
import { SpinTicket } from "@/modules/spin-dorayaki/types";
import { menuItems } from "../constants";

const menuItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export default function MenuGrid() {
  const router = useRouter();
  const { session } = useAuth();
  const studentId = session?.user?.id || "";

  // Query to get today's spin tickets count
  const { data: initialTickets = [] } = useQuery<SpinTicket[]>({
    queryKey: ["todaySpinTickets", studentId],
    queryFn: () => getTodaySpinTickets(studentId),
    enabled: !!studentId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Real-time listener để tự động cập nhật số lượng vé
  const [realTimeTickets, setRealTimeTickets] = useState<SpinTicket[] | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const unsubscribe = subscribeTodaySpinTickets(studentId, (tickets) => {
      setRealTimeTickets(tickets);
    });

    return () => {
      unsubscribe();
    };
  }, [studentId]);

  // Sử dụng real-time tickets nếu đã có data từ listener, nếu không thì dùng initial tickets
  const allSpinTickets = realTimeTickets !== null ? realTimeTickets : initialTickets;
  
  // Lấy số lượng vé hợp lệ (chưa sử dụng, trong ngày)
  const spinTicketCount = allSpinTickets.filter(
    (ticket) => ticket.status === "pending"
  ).length;

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {menuItems.map((item, index) => {
        const isSpinDorayaki = item.id === "spin-dorayaki";
        const ticketCount = isSpinDorayaki ? spinTicketCount : 0;

        return (
          <motion.div
            key={item.id}
            variants={menuItemVariants}
            initial="initial"
            animate="animate"
            custom={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center pb-2 relative"
            onClick={() => handleMenuClick(item.path)}
          >
            <div className="relative w-full aspect-16/9 mb-2 rounded-xl overflow-hidden">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                className="object-cover"
              />
              {/* Badge số lượng vé cho spin-dorayaki */}
              {isSpinDorayaki && ticketCount > 0 && (
                <div 
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 text-xs font-bold shadow-lg z-10"
                  style={{
                    animation: "blink-fast 0.6s ease-in-out infinite"
                  }}
                >
                  {ticketCount > 99 ? "99+" : ticketCount}
                </div>
              )}
            </div>
            <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-1">
              {item.title}
            </h3>
            <p className="text-xs text-gray-600 leading-tight">
              {item.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
