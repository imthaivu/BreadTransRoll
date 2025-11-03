"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/context";
import { getDb, getStorageBucket } from "@/lib/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { User, Edit3 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Flame } from "lucide-react";
// ...existing code...
export function AvatarCard() {
  const { session, profile } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(file: File | null) {
    if (!session?.user || !file) return;

    const toastId = toast.loading("Đang tải ảnh lên...");
    setAvatarUploading(true);
    try {
      const storage = getStorageBucket();
      const path = `users/${session.user.id}/avatar/${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
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
      <CardContent>
        <div className="flex flex-col items-center text-center gap-3">
          {/* Avatar */}
          <div className="relative">
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
          <div className="text-3xl font-medium text-slate-800">
            {(profile as { displayName?: string; email?: string })
              ?.displayName ??
              (profile as { displayName?: string; email?: string })?.email ??
              "Người dùng"}
          </div>

          {/* Streak */}
          {profile?.streakCount && profile.streakCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Flame className="text-orange-500 w-4 h-4" />
              <span>
                Đã liên tục học tiếng Anh trong{" "}
                <span className="font-medium text-slate-800">
                  {profile.streakCount}
                </span>{" "}
                ngày
              </span>
            </div>
          )}

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            ref={fileInputRef}
            onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
          />
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
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
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
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
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
