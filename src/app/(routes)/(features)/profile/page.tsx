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
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  Hồ sơ của bạn
                </h1>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="max-w-4xl mx-auto space-y-6">
                <AvatarCard />
                <PersonalInfoCard />
                {/* <PaymentInfoCard /> */}

                {/* Logout */}
                {session?.user && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      signOutApp();
                    }}
                    className="w-full justify-center mt-2 max-w-[200px]"
                  >
                    <FiLogOut /> <span className="ml-2">Đăng xuất</span>
                  </Button>
                )}
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </PageMotion>
    </RequireAuth>
  );
}
