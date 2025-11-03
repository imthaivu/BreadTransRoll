import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/context";
import { performSpin } from "./services";
import toast from "react-hot-toast";

interface UseSpinOptions {
  onSuccess?: (prize: string) => void;
  onError?: (error: Error) => void;
}

export function useSpin({ onSuccess, onError }: UseSpinOptions = {}) {
  const { session } = useAuth();
  const studentId = session?.user?.id || "";
  const sessionId = session?.user?.id || ""; // Sử dụng user ID làm session ID
  const queryClient = useQueryClient();

  const {
    mutate: spin,
    isPending: isSpinning,
    error: spinError,
  } = useMutation({
    mutationFn: async (ticketId: string) => {
      if (!studentId) {
        throw new Error("Bạn cần đăng nhập để quay bánh mì");
      }

      // Tạo device fingerprint
      const deviceInfo = `${navigator.userAgent}_${screen.width}x${
        screen.height
      }_${new Date().getTimezoneOffset()}`;

      const result = await performSpin(
        studentId,
        ticketId,
        deviceInfo,
        sessionId
      );
      return result;
    },
    onSuccess: (result) => {
      // Invalidate và refetch danh sách vé quay
      queryClient.invalidateQueries({
        queryKey: ["todaySpinTickets", studentId],
      });

      onSuccess?.(result.prize);
    },
    onError: (error) => {
      // Xử lý các loại lỗi khác nhau
      if (error.message.includes("Đang có người khác quay vé này")) {
        toast.error(
          "⚠️ Vé này đang được sử dụng ở tab khác. Vui lòng chờ và thử lại sau 5 giây."
        );
      } else if (error.message.includes("Bạn đang quay ở thiết bị khác")) {
        toast.error(
          "📱 Bạn đang quay ở thiết bị khác. Vui lòng chờ 1 phút trước khi thử lại."
        );
      } else if (error.message.includes("Bạn cần chờ")) {
        toast.error(`⏱️ ${error.message}`);
      } else if (error.message.includes("Phát hiện nhiều phiên")) {
        toast.error(
          "🔐 Phát hiện nhiều phiên đăng nhập. Vui lòng đăng xuất khỏi thiết bị khác."
        );
      } else if (error.message.includes("Vé quay đã được sử dụng")) {
        toast.error(
          "❌ Vé quay đã được sử dụng. Vui lòng làm mới trang để cập nhật danh sách vé."
        );
        // Tự động refetch danh sách vé
        queryClient.invalidateQueries({
          queryKey: ["todaySpinTickets", studentId],
        });
      } else if (error.message.includes("hết hạn")) {
        toast.error(
          "⏰ Vé quay đã hết hạn. Vé chỉ có thể sử dụng trong ngày tạo."
        );
        // Tự động refetch danh sách vé
        queryClient.invalidateQueries({
          queryKey: ["todaySpinTickets", studentId],
        });
      } else {
        toast.error(error.message);
      }
      onError?.(error);
    },
  });

  return {
    spin,
    isSpinning,
    spinError,
  };
}
