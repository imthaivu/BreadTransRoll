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
import { AppUserProfile, UserRole } from "./types";
import { trackVisit } from "@/services/stats.service";

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
              if (data.updated && data.newStreakCount > 0) {
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
      {streakData.showModal && (
        <Modal
          open={streakData.showModal}
          onClose={() => {
            setStreakData({ ...streakData, showModal: false });
            refetchProfile();
          }}
          title="Chúc Mừng!"
          maxWidth="sm"
        >
          <div className="text-center p-4">
            <FaFire className="mx-auto h-12 w-12 text-orange-500" />
            <h3 className="mt-2 text-lg font-medium">Bạn thật tuyệt vời!</h3>
            <p className="mt-2 text-md">
              Bạn đã duy trì chuỗi học tập trong{" "}
              <span className="font-bold text-primary">{streakData.count}</span>{" "}
              ngày liên tiếp.
            </p>
            <p className="mt-1 text-sm text-muted">
              Hãy tiếp tục phát huy nhé!
            </p>
            <Button
              onClick={() => setStreakData({ ...streakData, showModal: false })}
              className="mt-4"
            >
              Tiếp tục học
            </Button>
          </div>
        </Modal>
      )}

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
