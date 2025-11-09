"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PhoneRequiredModal } from "@/components/ui/PhoneRequiredModal";
import { getDb, getFirebaseAuth } from "@/lib/firebase/client";
import { useUpdateStudentStreak } from "@/modules/user/hooks";
import { signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Session } from "next-auth";
import {
  signIn as nextSignIn,
  signOut as nextSignOut,
  useSession,
} from "next-auth/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaFire } from "react-icons/fa";
import { FaStar, FaGem, FaTrophy, FaCrown } from "react-icons/fa";
import { AppUserProfile, UserRole } from "./types";
import { trackVisit } from "@/services/stats.service";

interface StreakMessage {
  icon: React.ReactElement;
  title: string;
  content: string;
  message: string;
}

interface AuthContextValue {
  profile: AppUserProfile | null;
  loading: boolean;
  role: UserRole | undefined;
  session: Session | null;
  isGuest: boolean;

  refetchProfile: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutApp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Milestone streak counts
const STREAK_MILESTONES = [7, 30, 100, 180, 200, 300, 365];

// Helper function to check if streak count is a milestone
const isStreakMilestone = (count: number): boolean => {
  return STREAK_MILESTONES.includes(count);
};

// Helper function to get streak message based on count
// Message is determined by range (>=), but modal only shows at specific milestones
// When count > milestone, use actual count instead of fixed number
const getStreakMessage = (count: number): StreakMessage => {
  if (count >= 365) {
    return {
      icon: <FaCrown className="mx-auto h-16 w-16 text-yellow-500" />,
      title: "Một năm không bỏ cuộc – bạn là huyền thoại!",
      content:
        `${count} ngày học liên tiếp – điều này nói lên tất cả: ý chí, đam mê, và khát vọng. Bạn đã tạo nên một thành tích đáng ngưỡng mộ mà ít ai có được.`,
      message:
        "Đây chưa phải là đích đến – mà là khởi đầu của một hành trình vĩ đại hơn!",
    };
  } else if (count >= 300) {
    return {
      icon: <FaCrown className="mx-auto h-16 w-16 text-purple-500" />,
      title: "300 ngày – gần đến một năm rồi!",
      content:
        `${count} ngày không ngừng nghỉ – bạn đang tiến gần đến cột mốc một năm! Sự kiên trì của bạn thật đáng ngưỡng mộ.`,
      message:
        "Chỉ còn vài tháng nữa thôi, hãy tiếp tục giữ vững tinh thần!",
    };
  } else if (count >= 200) {
    return {
      icon: <FaTrophy className="mx-auto h-16 w-16 text-indigo-500" />,
      title: "200 ngày – hành trình vượt trội!",
      content:
        `${count} ngày liên tục – bạn đã vượt qua hơn nửa năm! Mỗi ngày bạn học là một bước tiến vững chắc trên con đường thành công.`,
      message:
        "Bạn đang chứng minh rằng sự kiên trì có thể làm nên điều kỳ diệu!",
    };
  } else if (count >= 180) {
    return {
      icon: <FaTrophy className="mx-auto h-16 w-16 text-yellow-600" />,
      title: "Nửa năm – hành trình đáng khâm phục!",
      content:
        `${count} ngày kiên trì – bạn đã vượt xa 90% người học khác! Mỗi bài học bạn hoàn thành đang đưa bạn gần hơn đến sự tự tin thực sự.`,
      message:
        "Tiếp tục thôi, bạn đang trở thành một phiên bản mạnh mẽ hơn mỗi ngày!",
    };
  } else if (count >= 100) {
    return {
      icon: <FaGem className="mx-auto h-16 w-16 text-blue-500" />,
      title: "Bạn là hình mẫu của sự bền bỉ!",
      content:
        `${count} ngày liên tục – không phải ai cũng làm được điều này! Bạn đã chứng minh rằng nỗ lực nhỏ mỗi ngày tạo nên kết quả lớn.`,
      message:
        "Hãy tự hào về chính mình – và đừng dừng lại nhé!",
    };
  } else if (count >= 30) {
    return {
      icon: <FaStar className="mx-auto h-16 w-16 text-yellow-400" />,
      title: "Thói quen đang được hình thành!",
      content:
        `${count} ngày không bỏ cuộc – bạn đang xây dựng một thói quen vàng! Mỗi ngày học là một viên gạch trong tòa nhà thành công của bạn.`,
      message:
        "Tiếp tục nhé! Bạn đang dần trở thành người học tiếng Anh thật sự nghiêm túc.",
    };
  } else if (count >= 7) {
    return {
      icon: <FaFire className="mx-auto h-16 w-16 text-orange-500" />,
      title: "Khởi đầu tuyệt vời!",
      content:
        `Bạn đã duy trì học suốt ${count} ngày liên tiếp – một khởi đầu đáng nể! Hành trình dài bắt đầu từ những bước kiên trì như thế này.`,
      message:
        "Hãy tiếp tục giữ nhịp nhé, thành công đang hình thành rồi đó!",
    };
  } else {
    // Default message for streaks less than 7 days
    return {
      icon: <FaFire className="mx-auto h-12 w-12 text-orange-500" />,
      title: "Chúc Mừng!",
      content: `Bạn đã duy trì chuỗi học tập trong ${count} ngày liên tiếp.`,
      message: "Hãy tiếp tục phát huy nhé!",
    };
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, update, status } = useSession();
  const [streakData, setStreakData] = useState<{
    showModal: boolean;
    count: number;
  }>({
    showModal: false,
    count: 0,
  });

  const [phoneModalData, setPhoneModalData] = useState<{
    showModal: boolean;
    userId: string;
  }>({
    showModal: false,
    userId: "",
  });

  const { mutate: updateStreak } = useUpdateStudentStreak();

  useEffect(() => {
    // Logic for tracking visits
    if (status !== "loading") {
      if (session) {
        // User is logged in
        if (session.user?.role === UserRole.GUEST) {
          const hasTracked = sessionStorage.getItem("guest_visit_tracked");
          if (!hasTracked) {
            trackVisit("guest");
            sessionStorage.setItem("guest_visit_tracked", "true");
          }
        }
      } else {
        // User is anonymous
        const hasTracked = localStorage.getItem("anonymous_visit_tracked");
        if (!hasTracked) {
          trackVisit("anonymous");
          localStorage.setItem("anonymous_visit_tracked", "true");
        }
      }
    }
  }, [session, status]);

  const handleUpdatePhone = async (data: {
    phone: string;
    dateOfBirth: string;
    address: string;
    parentPhone: string;
    preferences: string;
    giftPhone: string;
  }) => {
    if (!phoneModalData.userId) return;

    try {
      const userRef = doc(getDb(), "users", phoneModalData.userId);
      await updateDoc(userRef, {
        phone: data.phone,
        dateOfBirth: new Date(data.dateOfBirth),
        address: data.address,
        parentPhone: data.parentPhone,
        preferences: data.preferences,
        giftPhone: data.giftPhone,
        updatedAt: new Date(),
      });

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          phone: data.phone,
          dateOfBirth: new Date(data.dateOfBirth),
          address: data.address,
          parentPhone: data.parentPhone,
          preferences: data.preferences,
          giftPhone: data.giftPhone,
          updatedAt: new Date(),
        });
      }

      // Close modal
      setPhoneModalData({ showModal: false, userId: "" });
    } catch (error) {
      console.error("Error updating user info:", error);
      throw error;
    }
  };

  const fetchProfile = useCallback(
    async (uid: string) => {
      setLoading(true);
      const ref = doc(getDb(), "users", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const current = (snap.data() as AppUserProfile) ?? null;
        setProfile(current);
        setLoading(false);

        // --- Required Info Check Logic for Students ---
        if (
          current?.role === "student" &&
          (!current.phone || 
           current.phone.trim() === "" ||
           !current.dateOfBirth ||
           !current.address ||
           current.address.trim() === "" ||
           !current.parentPhone ||
           current.parentPhone.trim() === "" ||
           !current.preferences ||
           current.preferences.trim() === "")
        ) {
          setPhoneModalData({ showModal: true, userId: current.uid });
        }

        // --- Streak Logic ---
        if (current?.role === "student") {
          updateStreak(current.uid, {
            onSuccess: (data) => {
              // Only show modal when streak count reaches a specific milestone
              if (data.updated && isStreakMilestone(data.newStreakCount)) {
                setStreakData({ showModal: true, count: data.newStreakCount });
              }
            },
          });
        }
        // --- End of Streak Logic ---
      } else {
        const newProfile: AppUserProfile = {
          uid: uid,
          displayName: (session?.user?.name as string | null) ?? null,
          email: (session?.user?.email as string | null) ?? null,
          avatarUrl: session?.user?.image as string | undefined,
          role: UserRole.GUEST,
          isActive: true,
          classIds: [],
          bankAccount: "",
          phone: "",
          address: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(ref, newProfile);
        setProfile(newProfile);
        setLoading(false);
      }
    },
    [session?.user, updateStreak]
  );

  const refetchProfile = useCallback(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    }
  }, [fetchProfile, session?.user]);

  // Từ Id của NextAuth để lấy profile
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
      setUser(getFirebaseAuth().currentUser);
    } else {
      setProfile(null);
      setUser(null);
      setLoading(false);
    }
  }, [fetchProfile, session?.user]);

  const signInWithGoogle = useCallback(async () => {
    await nextSignIn("google");
  }, []);

  const signOutApp = useCallback(async () => {
    try {
      await Promise.all([nextSignOut(), signOut(getFirebaseAuth())]);
      setProfile(null);
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading: status === "loading",
      role: session?.user?.role,
      isGuest: !session?.user?.role || session?.user?.role === UserRole.GUEST,

      refetchProfile,
      signInWithGoogle,
      signOutApp,
    }),
    [session, profile, status, refetchProfile, signInWithGoogle, signOutApp]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {streakData.showModal && (() => {
        const streakMessage = getStreakMessage(streakData.count);
        return (
          <Modal
            open={streakData.showModal}
            onClose={() => {
              setStreakData({ ...streakData, showModal: false });
              refetchProfile();
            }}
            title={streakMessage.title}
            maxWidth="sm"
          >
            <div className="text-center p-4">
              {streakMessage.icon}
              <p className="mt-4 text-md leading-relaxed">
                {streakMessage.content}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">
                {streakMessage.message}
              </p>
              <div className="mt-4 text-sm text-muted">
                <span className="font-bold text-primary">{streakData.count}</span> ngày liên tiếp
              </div>
              <Button
                onClick={() => {
                  setStreakData({ ...streakData, showModal: false });
                  refetchProfile();
                }}
                className="mt-6"
              >
                Tiếp tục học
              </Button>
            </div>
          </Modal>
        );
      })()}

      {/* Required Info Modal for Students */}
      {phoneModalData.showModal && (
        <PhoneRequiredModal
          isOpen={phoneModalData.showModal}
          onClose={() => {}} // Prevent closing without required info
          onSave={handleUpdatePhone}
          currentData={{
            phone: profile?.phone || "",
            dateOfBirth: profile?.dateOfBirth,
            address: profile?.address || "",
            parentPhone: profile?.parentPhone || "",
            preferences: profile?.preferences || "",
            giftPhone: profile?.giftPhone || (profile?.phone ? "student" : "parent") || "parent",
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
