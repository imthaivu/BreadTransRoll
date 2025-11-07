"use client";

import { useAuth } from "@/lib/auth/context";
import { SpinningWheel } from "@/modules/spin-dorayaki/components/SpinningWheel";

export default function SpinDorayakiPage() {
  const { session, role } = useAuth();
  const isNotLoggedIn = !session?.user;
  const isGuest = role === "guest";

  return (
    <>
      <div className="text-center">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
          Vòng quay bánh mì
        </h1>
      </div>
      
      {(isNotLoggedIn || isGuest) && (
        <div className="text-center p-4 my-4 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm md:text-base text-yellow-800">
            Bạn đang xem trước giao diện. Tham gia để sử dụng tính năng này!
          </p>
        </div>
      )}
      
      <SpinningWheel />
    </>
  );
}
