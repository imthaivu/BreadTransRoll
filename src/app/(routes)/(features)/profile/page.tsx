"use client";

import {
  AvatarCard,
  PersonalInfoCard,
} from "@/components/profile/ProfileSections";
import { Button } from "@/components/ui/Button";
import PageMotion, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/PageMotion";
import { useAuth } from "@/lib/auth/context";
import { RequireAuth } from "@/lib/auth/guard";
import { FiLogOut } from "react-icons/fi";

export default function ProfilePage() {
  const { session, signOutApp } = useAuth();

  return (
    <RequireAuth>
      <PageMotion showLoading={false}>
        <div className="bg-white">
          <StaggerContainer>
            

            <StaggerItem>
              <div className="max-w-4xl mx-auto space-y-6">
                <AvatarCard />
                <PersonalInfoCard />
                {/* <PaymentInfoCard /> */}

                {/* Logout */}
                {session?.user && (
                  <div className="px-4 sm:px-0 mt-4 mb-8 sm:mb-6">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        signOutApp();
                      }}
                      className="w-full sm:w-auto sm:mx-auto flex items-center justify-center min-h-[48px] sm:min-h-[44px] px-6 py-3 sm:py-2.5 text-base sm:text-sm font-medium touch-manipulation active:scale-95 transition-transform select-none"
                    >
                      <FiLogOut className="mr-2 w-5 h-5 sm:w-4 sm:h-4" /> Đăng xuất
                    </Button>
                  </div>
                )}
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </PageMotion>
    </RequireAuth>
  );
}
