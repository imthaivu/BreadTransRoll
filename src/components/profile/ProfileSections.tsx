"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/context";
import { getDb, getStorageBucket } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes, deleteObject, listAll } from "firebase/storage";
import { User, Edit3 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Flame } from "lucide-react";
import { compressAndResizeImage } from "@/utils/image";
// ...existing code...
// Combined Avatar and Achievements Card
export function AvatarCard() {
  const { session, profile } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileWithExtras = profile as {
    rank?: "dong" | "bac" | "vang" | "kim cuong" | "cao thu";
    badges?: string[];
    mvpWins?: number;
    mvpLosses?: number;
  };

  const rankNames: Record<string, string> = {
    dong: "Đồng",
    bac: "Bạc",
    vang: "Vàng",
    "kim cuong": "Kim cương",
    "cao thu": "Cao thủ",
  };

  // Badge name to image file mapping
  const badgeImageMap: Record<string, string> = {
    "Fast Learner": "fast.png",
    "Never Missed": "never.png",
    "Master of Words": "master.png",
    "Pronunciation Pro": "pronun.png",
    "Grammar Guardian": "gramar.png",
  };

  async function handleAvatarChange(file: File | null) {
    if (!session?.user || !file) return;

    const toastId = toast.loading("Đang xử lý và tải ảnh lên...");
    setAvatarUploading(true);
    try {
      // Compress and resize image before upload (400x400, quality 0.85)
      const compressedFile = await compressAndResizeImage(file, 400, 400, 0.85);
      
      const storage = getStorageBucket();
      
      // Delete all old avatar files in the folder before uploading new one
      const avatarFolderRef = ref(storage, `users/${session.user.id}/avatar`);
      try {
        const oldFiles = await listAll(avatarFolderRef);
        // console.log(`Found ${oldFiles.items.length} old avatar file(s) to delete`);
        // Delete all files in the avatar folder
        if (oldFiles.items.length > 0) {
          const deletePromises = oldFiles.items.map((item) => {
            // console.log(`Deleting old avatar: ${item.fullPath}`);
            return deleteObject(item);
          });
          await Promise.all(deletePromises);
          // console.log("All old avatar files deleted successfully");
        }
      } catch (deleteError: unknown) {
        // Ignore errors - folder might not exist or already empty
        // This is expected for first-time uploads
        // console.log("No old avatar files to delete or error:", deleteError);
      }

      // Use fixed filename to ensure only one avatar exists (always jpg after compression)
      const path = `users/${session.user.id}/avatar/avatar.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(getDb(), "users", session.user.id), {
        avatarUrl: url,
      });
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra.", { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Left side: Avatar section */}
          <div className="flex flex-col items-center text-center flex-shrink-0 w-full md:w-auto md:max-w-xs">
            {/* Avatar */}
            <div className="relative mb-3">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
                  <User size={48} className="text-slate-500" />
                </div>
              )}

              {/* small edit icon bottom-right */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title="Đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Edit3 size={16} />
              </button>
            </div>

            {/* Tên người dùng */}
            <div className="text-2xl sm:text-3xl font-medium text-slate-800 mb-2">
              {(profile as { displayName?: string; email?: string })
                ?.displayName ??
                (profile as { displayName?: string; email?: string })?.email ??
                "Người dùng"}
            </div>

            {/* Streak */}
            {profile?.streakCount && profile.streakCount > 0 && (() => {
              const userName = (profile as { displayName?: string; email?: string })
                ?.displayName ??
                (profile as { displayName?: string; email?: string })?.email ??
                "Bạn";
              return (
                <div className="space-y-2 w-full">
                  {profile.streakCount < 30 ? (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Flame className="text-orange-500 w-4 h-4 flex-shrink-0" />
                      <span>
                        Đã liên tục học tiếng Anh trong{" "}
                        <span className="font-medium text-slate-800">
                          {profile.streakCount}
                        </span>{" "}
                        ngày
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-600 italic leading-relaxed break-words">
                      <span className="font-semibold text-slate-800">{userName}</span>
                      {" là minh chứng sống cho sự kiên trì — hiếm ai bằng tuổi có thể học tiếng Anh 1 tiếng/ngày liên tục suốt "}
                      <span className="font-semibold text-orange-600">
                        {profile.streakCount}
                      </span>
                      {" ngày. Ý chí và quyết tâm ấy đã giúp "}
                      <span className="font-semibold text-slate-800">{userName}</span>
                      {" vượt qua hơn 80% người khác. BreadTrans, Gia đình đều tự hào về bạn đấy."}
                      <span className="font-semibold text-slate-800">{userName}</span>
                      {", và mọi người đều phải nể phục tinh thần không bỏ cuộc này."}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              ref={fileInputRef}
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Right side: Achievements section */}
          {(profileWithExtras?.rank || 
            profileWithExtras?.badges?.length || 
            profileWithExtras?.mvpWins !== undefined || 
            profileWithExtras?.mvpLosses !== undefined) && (
            <div className="flex-1 space-y-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 lg:pl-8 border-gray-200 min-w-0 overflow-hidden">
              {/* Rank */}
              {profileWithExtras?.rank && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Rank:</span>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <Image
                      src={`/assets/rank/${profileWithExtras.rank.replace(" ", "-")}.png`}
                      alt={profileWithExtras.rank}
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-gray-800">
                    {rankNames[profileWithExtras.rank] || profileWithExtras.rank}
                  </span>
                </div>
              )}

              {/* MVP Stats */}
              {(profileWithExtras?.mvpWins !== undefined || profileWithExtras?.mvpLosses !== undefined) && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 flex-shrink-0">MVP:</span>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {profileWithExtras?.mvpWins !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                          <Image
                            src="/assets/rank/do.png"
                            alt="MVP Win"
                            width={40}
                            height={40}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                          />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          : <span className="font-semibold">{profileWithExtras.mvpWins || 0}</span>
                        </span>
                      </div>
                    )}
                    {profileWithExtras?.mvpLosses !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                          <Image
                            src="/assets/rank/tim.png"
                            alt="MVP Loss"
                            width={40}
                            height={40}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                          />
                        </div>
                        <span className="text-sm sm:text-base text-gray-700">
                          : <span className="font-semibold">{profileWithExtras.mvpLosses || 0}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Badges */}
              {profileWithExtras?.badges && profileWithExtras.badges.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Huy hiệu:</span>
                  <div className="flex flex-wrap gap-2">
                    {profileWithExtras.badges.map((badge) => {
                      const badgeImage = badgeImageMap[badge];
                      return (
                        <div
                          key={badge}
                          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5  bg-primary/10 border border-primary/30 rounded-lg flex-shrink-0 max-w-full"
                        >
                          {badgeImage && (
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                              <Image
                                src={`/assets/rank/${badgeImage}`}
                                alt={badge}
                                width={40}
                                height={40}
                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                              />
                            </div>
                          )}
                          <span className="text-sm sm:text-base font-medium text-primary whitespace-nowrap">
                            {badge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ...existing code...
export function PersonalInfoCard() {
  const { session, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [saving, setSaving] = useState(false);

  // Update form fields when profile data is loaded
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  async function handleSave() {
    if (!session?.user) return;
    setSaving(true);
    const toastId = toast.loading("Đang lưu thông tin...");
    try {
      await updateDoc(doc(getDb(), "users", session.user.id), {
        displayName,
        phone,
        address,
      });
      toast.success("Cập nhật thông tin thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra.", { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2"
              placeholder="Nhập tên của bạn"
            />
          </div>
          <div>
            <label className="block text-sm md:text-base font-medium text-slate-700">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary px-4 py-2"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm md:text-base font-medium text-slate-700">
            Địa chỉ
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
            placeholder="Nhập địa chỉ"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
