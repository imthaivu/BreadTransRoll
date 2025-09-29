"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FiPhone, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { Input } from "./Input";

interface PhoneRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phone: string) => Promise<void>;
  currentPhone?: string;
}

export function PhoneRequiredModal({
  isOpen,
  onClose,
  onSave,
  currentPhone = "",
}: PhoneRequiredModalProps) {
  const [phone, setPhone] = useState(currentPhone);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    // Basic phone validation for Vietnamese numbers
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(phone.trim());
      toast.success("Cập nhật số điện thoại thành công!");
      onClose();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật số điện thoại");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        toast.error("Vui lòng cập nhật số điện thoại để tiếp tục");
      }} // Prevent closing without phone
      title=""
      maxWidth="sm"
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
            <FiAlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cập nhật số điện thoại
          </h3>
          <p className="text-sm text-gray-600">
            Để tiếp tục sử dụng hệ thống, bạn cần cập nhật số điện thoại của
            mình.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại của bạn"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Ví dụ: 0901234567 hoặc +84901234567
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !phone.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Lưu ý:</strong> Số điện thoại sẽ được sử dụng để liên hệ
            trong trường hợp cần thiết.
          </p>
        </div>
      </div>
    </Modal>
  );
}
