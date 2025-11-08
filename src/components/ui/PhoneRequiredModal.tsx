"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FiPhone, FiAlertCircle, FiCalendar, FiMapPin, FiHeart } from "react-icons/fi";
import toast from "react-hot-toast";
import { Input } from "./Input";

interface PhoneRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    phone: string;
    dateOfBirth: string;
    address: string;
    parentPhone: string;
    preferences: string;
    giftPhone: string;
  }) => Promise<void>;
  currentData?: {
    phone?: string;
    dateOfBirth?: Date | string;
    address?: string;
    parentPhone?: string;
    preferences?: string;
    giftPhone?: string;
  };
}

export function PhoneRequiredModal({
  isOpen,
  onClose,
  onSave,
  currentData = {},
}: PhoneRequiredModalProps) {
  const [phone, setPhone] = useState(currentData.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    currentData.dateOfBirth
      ? typeof currentData.dateOfBirth === "string"
        ? currentData.dateOfBirth
        : new Date(currentData.dateOfBirth).toISOString().split("T")[0]
      : ""
  );
  const [address, setAddress] = useState(currentData.address || "");
  const [parentPhone, setParentPhone] = useState(currentData.parentPhone || "");
  const [preferences, setPreferences] = useState(currentData.preferences || "");
  const [useParentPhone, setUseParentPhone] = useState<boolean>(
    currentData.giftPhone !== "student"
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentData) {
      setPhone(currentData.phone || "");
      setDateOfBirth(
        currentData.dateOfBirth
          ? typeof currentData.dateOfBirth === "string"
            ? currentData.dateOfBirth
            : new Date(currentData.dateOfBirth).toISOString().split("T")[0]
          : ""
      );
      setAddress(currentData.address || "");
      setParentPhone(currentData.parentPhone || "");
      setPreferences(currentData.preferences || "");
      setUseParentPhone(currentData.giftPhone !== "student");
    }
  }, [isOpen, currentData]);

  // Auto-select parent phone when student phone is removed
  useEffect(() => {
    const hasStudentPhone = phone.trim() !== "";
    
    // If no student phone exists, must use parent phone
    if (!hasStudentPhone) {
      setUseParentPhone(true);
    }
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!dateOfBirth) {
      toast.error("Vui lòng chọn ngày sinh nhật");
      return;
    }

    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ nhận quà");
      return;
    }

    if (!parentPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại phụ huynh");
      return;
    }

    if (!preferences.trim()) {
      toast.error("Vui lòng nhập sở thích cá nhân");
      return;
    }

    // Phone validation for Vietnamese numbers
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    
    // Validate student phone if provided
    if (phone.trim() && !phoneRegex.test(phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại học sinh không hợp lệ");
      return;
    }

    // Validate parent phone
    if (!phoneRegex.test(parentPhone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại phụ huynh không hợp lệ");
      return;
    }

    // Determine gift phone
    const finalGiftPhone = useParentPhone ? parentPhone.trim() : (phone.trim() || parentPhone.trim());

    setIsLoading(true);
    try {
      await onSave({
        phone: phone.trim(),
        dateOfBirth,
        address: address.trim(),
        parentPhone: parentPhone.trim(),
        preferences: preferences.trim(),
        giftPhone: finalGiftPhone,
      });
      toast.success("Cập nhật thông tin thành công!");
      onClose();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật thông tin");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        toast.error("Vui lòng hoàn tất thông tin để tiếp tục");
      }}
      title=""
      maxWidth="md"
      closeOnOverlayClick={false}
    >
      <div className="p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
            Nhập thông tin để nhận quà ưng ý
          </h3>
         
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Date of Birth */}
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Ngày sinh nhật <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="pl-9 sm:pl-10"
                required
                disabled={isLoading}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Số điện thoại học sinh 
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="pl-9 sm:pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Địa chỉ nhận quà <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start pointer-events-none">
                <FiMapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ để Milu giao quà"
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                rows={2}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Parent Phone */}
          <div>
            <label
              htmlFor="parentPhone"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Số điện thoại phụ huynh <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <Input
                id="parentPhone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="0901234567"
                className="pl-9 sm:pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Gift Phone Selection - Checkbox to use parent phone */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useParentPhone}
                onChange={(e) => setUseParentPhone(e.target.checked)}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-2 border-gray-300 rounded"
                disabled={isLoading || !phone.trim()}
              />
              <span className="ml-2 text-xs sm:text-sm text-gray-700">
                Dùng số điện thoại phụ huynh để nhận quà
              </span>
            </label>
            {!phone.trim() && (
              <p className="mt-1 text-xs text-gray-500 ml-6">
                (Vì chưa nhập số điện thoại học sinh)
              </p>
            )}
          </div>

          {/* Preferences */}
          <div>
            <label
              htmlFor="preferences"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Sở thích cá nhân <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start pointer-events-none">
                <FiHeart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <textarea
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Ví dụ: Chơi game, Thể thao, Thời trang, Làm đẹp..."
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                rows={3}
                required
                disabled={isLoading}
              />
            </div>
            
          </div>

          <div className="flex justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4">
            <Button
              type="submit"
              disabled={isLoading || !dateOfBirth || !address.trim() || !parentPhone.trim() || !preferences.trim()}
              className=" bg-primary text-white text-sm sm:text-base px-4 sm:px-6"
            >
              {isLoading ? "Đang cập nhật..." : "Hoàn tất"}
            </Button>
          </div>
        </form>
        
      </div>
    </Modal>
  );
}
