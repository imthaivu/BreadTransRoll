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
                  <Button
                    variant="secondary"
                    onClick={() => {
                      signOutApp();
                    }}
                    className="mx-auto mt-4 flex items-center"
                  >
                    <FiLogOut className="mr-2" /> Đăng xuất
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
