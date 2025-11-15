"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/context";
import { IClass, IClassMember } from "@/types";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiMinusCircle, FiPlusCircle, FiUser, FiPhone, FiTrendingUp, FiDollarSign, FiEdit } from "react-icons/fi";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  useClassDetails,
  useClassMembers,
} from "../hooks";
import { useStudents } from "@/modules/admin/hooks/useStudentManagement";
import { useCreateCurrencyTransaction } from "@/modules/admin/hooks/useCurrencyManagement";
import { createSpinTicketByTeacher } from "@/modules/spin-dorayaki/services";
import { TeacherEditStudentModal } from "./TeacherEditStudentModal";

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
  const { session, profile } = useAuth();
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
  const { mutate: createTransaction, isPending } = useCreateCurrencyTransaction();

  const amount = watch("amount");
  const quickAmounts = [5, 10, 20, 30, 50];

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: { amount: number; reason: string }) => {
    if (!session?.user || !profile) return;

    // Validation for subtract
    if (type === "subtract" && data.amount > currentBalance) {
      toast.error(
        `Không thể trừ ${data.amount} bánh mì. Số dư hiện tại chỉ có ${currentBalance} bánh mì.`
      );
      return;
    }

    createTransaction(
      {
        studentId: member.id,
        studentName: member.name,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        userRole: profile.role,
        amount: data.amount,
        reason: data.reason,
        type: type,
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
      title={`${type === "add" ? "Cộng" : "Trừ"} bánh mì cho ${
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
            {isPending ? "Đang xử lý..." : "Xác nhận"}
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
  const [contactModal, setContactModal] = useState<IClassMember | null>(null);
  const [ticketModal, setTicketModal] = useState<{
    member: IClassMember;
  } | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [isPremiumTicket, setIsPremiumTicket] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [editStudentModal, setEditStudentModal] = useState<IClassMember | null>(null);

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
              {/* Avatar with edit button */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-gray-500" />
                </div>
                {member.role === "student" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditStudentModal(member);
                    }}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                    title="Sửa thông tin học sinh"
                  >
                    <FiEdit className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{member.name}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Contact button - single phone icon */}
              {(member.phone || member.parentPhone) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContactModal(member);
                  }}
                  title="Liên lạc"
                  className="p-2"
                >
                  <FiPhone className="h-5 w-5 text-primary" />
                </Button>
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
                    <span className="ml-1 hidden md:inline">Cộng</span>
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
                    <span className="ml-1 hidden md:inline">Trừ</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTicketModal({ member });
                    }}
                    title="Phát vé quay bánh mì"
                  >
                    <FiDollarSign className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Phát vé</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMemberClick(member)}
                  >
                    <FiTrendingUp className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Xem tiến trình</span>
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
          member={contactModal}
        />
      )}

      {/* Edit Student Modal */}
      {editStudentModal && (
        <TeacherEditStudentModal
          member={editStudentModal}
          isOpen={!!editStudentModal}
          onClose={() => setEditStudentModal(null)}
        />
      )}

      {/* Ticket Modal */}
      {ticketModal && classDetails && (
        <Modal
          open={!!ticketModal}
          onClose={() => {
            setTicketModal(null);
            setTicketQuantity(1);
            setIsPremiumTicket(false);
          }}
          maxWidth="sm"
          title="Phát vé quay bánh mì"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Phát vé cho học sinh: <strong>{ticketModal.member.name}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng vé <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={ticketQuantity}
                onChange={(e) => setTicketQuantity(Number(e.target.value))}
              >
                <option value={1}>1 vé</option>
                <option value={2}>2 vé</option>
                <option value={3}>3 vé</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="premium-ticket"
                checked={isPremiumTicket}
                onChange={(e) => setIsPremiumTicket(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="premium-ticket" className="text-sm font-medium text-gray-700 cursor-pointer">
                Vé xịn (tỉ lệ trúng giải cao hơn)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTicketModal(null);
                  setTicketQuantity(1);
                  setIsPremiumTicket(false);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={async () => {
                  if (!ticketModal) return;

                  setIsCreatingTicket(true);
                  try {
                    await createSpinTicketByTeacher(
                      ticketModal.member.id,
                      classDetails.name,
                      ticketQuantity,
                      isPremiumTicket
                    );
                    toast.success(
                      `Phát ${ticketQuantity} ${isPremiumTicket ? "vé xịn" : "vé"} thành công!`
                    );
                    setTicketModal(null);
                    setTicketQuantity(1);
                    setIsPremiumTicket(false);
                  } catch (error) {
                    console.error("Error creating ticket:", error);
                    toast.error("Có lỗi xảy ra khi phát vé");
                  } finally {
                    setIsCreatingTicket(false);
                  }
                }}
                disabled={isCreatingTicket}
              >
                {isCreatingTicket ? "Đang phát vé..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: IClassMember;
}

function ContactModal({ isOpen, onClose, member }: ContactModalProps) {
  const hasPhone = !!member.phone;
  const hasParentPhone = !!member.parentPhone;

  const handleContact = (type: "zalo" | "phone", contact: "student" | "parent") => {
    const phoneNumber = contact === "student" ? member.phone : member.parentPhone;
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

  // Build list of contact options
  const contactOptions: Array<{ type: "zalo" | "phone"; contact: "student" | "parent"; label: string; phone: string }> = [];
  
  if (hasPhone) {
    contactOptions.push(
      { type: "zalo", contact: "student", label: "Zalo học sinh", phone: member.phone! },
      { type: "phone", contact: "student", label: "Gọi học sinh", phone: member.phone! }
    );
  }
  
  if (hasParentPhone) {
    contactOptions.push(
      { type: "zalo", contact: "parent", label: "Zalo phụ huynh", phone: member.parentPhone! },
      { type: "phone", contact: "parent", label: "Gọi phụ huynh", phone: member.parentPhone! }
    );
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title="Liên lạc"
    >
      <div className="space-y-2">
        {contactOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleContact(option.type, option.contact)}
            className="w-full p-3 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{option.label}</p>
                <p className="text-sm text-gray-600">{option.phone}</p>
              </div>
              {option.type === "zalo" ? (
                <Image
                  src="/assets/images/zalo.png"
                  alt="Zalo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              ) : (
                <FiPhone className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
