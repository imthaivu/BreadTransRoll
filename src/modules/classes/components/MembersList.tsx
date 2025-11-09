"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/context";
import { IClass, IClassMember } from "@/types";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiMinusCircle, FiPlusCircle, FiUser, FiPhone } from "react-icons/fi";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  useClassDetails,
  useClassMembers,
  useCreateCurrencyRequest,
} from "../hooks";
import { useStudents } from "@/modules/admin/hooks/useStudentManagement";

interface CurrencyRequestModalProps {
  member: IClassMember;
  classDetails: IClass;
  type: "add" | "subtract";
  isOpen: boolean;
  onClose: () => void;
}

function CurrencyRequestModal({
  member,
  classDetails,
  type,
  isOpen,
  onClose,
}: CurrencyRequestModalProps) {
  const { session } = useAuth();
  const { data: studentsData } = useStudents();
  const allStudents = studentsData?.data || [];
  const student = allStudents.find((s) => s.id === member.id);
  const currentBalance = student?.totalBanhRan || 0;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{ amount: number; reason: string }>();
  const { mutate: createRequest, isPending } = useCreateCurrencyRequest();

  const amount = watch("amount");
  const quickAmounts = [5, 10, 20, 30, 50];

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: { amount: number; reason: string }) => {
    if (!session?.user) return;

    // Validation for subtract
    if (type === "subtract" && data.amount > currentBalance) {
      toast.error(
        `Không thể trừ ${data.amount} bánh mì. Số dư hiện tại chỉ có ${currentBalance} bánh mì.`
      );
      return;
    }

    createRequest(
      {
        studentId: member.id,
        studentName: member.name,
        teacherId: session.user.id,
        teacherName: session.user.name || session.user.email!,
        classId: classDetails.id,
        className: classDetails.name,
        amount: type === "add" ? data.amount : -data.amount,
        reason: data.reason,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Yêu cầu ${type === "add" ? "cộng" : "trừ"} bánh mì cho ${
        member.name
      }`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Balance Display */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-800">
              Số bánh mì hiện tại:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-orange-600">
                {currentBalance}
              </span>
              <Image
                src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
                alt="bánh mì"
                width={20}
                height={20}
                className="inline-block"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-2">
            Số lượng
          </label>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue("amount", quickAmount, { shouldValidate: true })
                }
                disabled={type === "subtract" && quickAmount > currentBalance}
              >
                {quickAmount}
              </Button>
            ))}
          </div>
          <input
            id="amount"
            type="number"
            {...register("amount", {
              required: "Vui lòng nhập số lượng",
              valueAsNumber: true,
              min: { value: 1, message: "Số lượng phải lớn hơn 0" },
              max:
                type === "subtract"
                  ? {
                      value: currentBalance,
                      message: `Số lượng không được vượt quá ${currentBalance} bánh mì hiện có`,
                    }
                  : undefined,
            })}
            className="mt-1 block w-full p-2 border rounded-md"
            min="1"
            max={type === "subtract" ? currentBalance : undefined}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
          )}
          {type === "subtract" && amount && amount > currentBalance && (
            <p className="text-red-500 text-xs mt-1">
              Số lượng trừ không được vượt quá số bánh mì hiện có ({currentBalance})
            </p>
          )}
          {type === "subtract" && amount && amount <= currentBalance && (
            <p className="text-green-600 text-xs mt-1">
              Sau khi trừ, số bánh mì còn lại: {currentBalance - amount}
            </p>
          )}
          {type === "add" && amount && (
            <p className="text-green-600 text-xs mt-1">
              Sau khi cộng, số bánh mì sẽ là: {currentBalance + amount}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="reason" className="block text-sm font-medium">
            Lý do
          </label>
          <textarea
            id="reason"
            {...register("reason", { required: "Vui lòng nhập lý do" })}
            className="mt-1 block w-full p-2 border rounded-md"
            rows={3}
          />
          {errors.reason && (
            <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MembersList({
  classId,
  onMemberClick,
}: {
  classId: string;
  onMemberClick: (member: IClassMember) => void;
}) {
  const { session } = useAuth();
  const { data: members, isLoading, error } = useClassMembers(classId);
  const { data: classDetails } = useClassDetails(
    classId,
    session?.user.id || ""
  );
  const { data: studentsData } = useStudents();
  const allStudents = studentsData?.data || [];
  const [requestModal, setRequestModal] = useState<{
    member: IClassMember;
    type: "add" | "subtract";
  } | null>(null);
  const [contactModal, setContactModal] = useState<{
    member: IClassMember;
    type: "zalo" | "phone";
  } | null>(null);

  if (isLoading) return <p>Đang tải danh sách thành viên...</p>;
  if (error) return <p className="text-red-500">Lỗi tải danh sách.</p>;

  // Filter to only show students (not teachers)
  const students = members?.filter((member) => member.role === "student") || [];

  return (
    <div className="space-y-3">
      {students.map((member) => {
        // Get balance for disable logic (but don't display it)
        const student = allStudents.find((s) => s.id === member.id);
        const balance = student?.totalBanhRan || 0;
        return (
          <div
            key={member.id}
            className="flex md:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex-col md:flex-row gap-2"
          >
            {/* Info */}
            <div className="flex items-center gap-3">
              {/* Avatar placeholder - no image loading for performance */}
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                <FiUser className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{member.name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Contact buttons - show if has phone or parentPhone */}
              {(member.phone || member.parentPhone) && (
                <>
                  {/* Zalo button */}
                  {(member.phone || member.parentPhone) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContactModal({ member, type: "zalo" });
                      }}
                      title="Liên lạc Zalo"
                      className="p-2"
                    >
                      <Image
                        src="/assets/images/zalo.png"
                        alt="Zalo"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </Button>
                  )}
                  {/* Phone button */}
                  {(member.phone || member.parentPhone) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContactModal({ member, type: "phone" });
                      }}
                      title="Gọi điện"
                      className="p-2"
                    >
                      <FiPhone className="h-5 w-5 text-primary" />
                    </Button>
                  )}
                </>
              )}
              {member.role === "student" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRequestModal({ member, type: "add" });
                    }}
                    title="Cộng bánh mì"
                  >
                    <FiPlusCircle className="h-5 w-5 text-green-500" />
                    <span className="ml-1">Cộng</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRequestModal({ member, type: "subtract" });
                    }}
                    title="Trừ bánh mì"
                    disabled={balance === 0}
                  >
                    <FiMinusCircle className="h-5 w-5 text-red-500" />
                    <span className="ml-1">Trừ</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMemberClick(member)}
                  >
                    <FiUser className="mr-2 h-4 w-4" />
                    Xem tiến trình
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
      {requestModal && (
        <CurrencyRequestModal
          isOpen={!!requestModal}
          onClose={() => setRequestModal(null)}
          member={requestModal.member}
          type={requestModal.type}
          classDetails={classDetails || {
            id: classId,
            name: "Lớp học",
            teacher: { id: "", name: "", phone: "" },
            status: "active",
            links: { zalo: "", meet: "" },
            createdAt: new Date(),
            updatedAt: new Date(),
          } as IClass}
        />
      )}

      {/* Contact Modal */}
      {contactModal && (
        <ContactModal
          isOpen={!!contactModal}
          onClose={() => setContactModal(null)}
          member={contactModal.member}
          type={contactModal.type}
        />
      )}
    </div>
  );
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: IClassMember;
  type: "zalo" | "phone";
}

function ContactModal({ isOpen, onClose, member, type }: ContactModalProps) {
  const hasPhone = !!member.phone;
  const hasParentPhone = !!member.parentPhone;
  const [selectedContact, setSelectedContact] = useState<"student" | "parent" | null>(null);

  // Auto-select if only one option available
  useEffect(() => {
    if (isOpen) {
      if (hasPhone && !hasParentPhone) {
        setSelectedContact("student");
      } else if (!hasPhone && hasParentPhone) {
        setSelectedContact("parent");
      } else {
        setSelectedContact(null);
      }
    }
  }, [isOpen, hasPhone, hasParentPhone]);

  const handleConfirm = () => {
    if (!selectedContact) return;

    const phoneNumber = selectedContact === "student" ? member.phone : member.parentPhone;
    if (!phoneNumber) return;

    if (type === "zalo") {
      // Open Zalo link
      window.open(`https://zalo.me/${phoneNumber.replace(/\D/g, "")}`, "_blank");
    } else {
      // Open phone call
      window.location.href = `tel:${phoneNumber.replace(/\D/g, "")}`;
    }
    onClose();
  };

  const handleSelectContact = (contact: "student" | "parent") => {
    setSelectedContact(contact);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={type === "zalo" ? "Liên lạc Zalo" : "Gọi điện"}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Bạn muốn liên lạc với ai?
        </p>

        <div className="space-y-2">
          {hasPhone && (
            <button
              onClick={() => handleSelectContact("student")}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedContact === "student"
                  ? "border-primary  bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-gray-800">Học sinh</p>
                  <p className="text-sm text-gray-600">{member.phone}</p>
                </div>
                {selectedContact === "student" && (
                  <div className="w-5 h-5 rounded-full  bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )}

          {hasParentPhone && (
            <button
              onClick={() => handleSelectContact("parent")}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedContact === "parent"
                  ? "border-primary  bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-gray-800">Phụ huynh</p>
                  <p className="text-sm text-gray-600">{member.parentPhone}</p>
                </div>
                {selectedContact === "parent" && (
                  <div className="w-5 h-5 rounded-full  bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedContact}
          >
            {type === "zalo" ? "Mở Zalo" : "Gọi điện"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
