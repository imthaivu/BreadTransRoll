"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/context";
import { IClass, IClassMember } from "@/types";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiMinusCircle, FiPlusCircle, FiUser } from "react-icons/fi";
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

  if (isLoading) return <p>Đang tải danh sách thành viên...</p>;
  if (error) return <p className="text-red-500">Lỗi tải danh sách.</p>;

  return (
    <div className="space-y-3">
      {members?.map((member) => {
        const student = allStudents.find((s) => s.id === member.id);
        const balance = student?.totalBanhRan || 0;

        return (
          <div
            key={member.id}
            className="flex md:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex-col md:flex-row gap-2"
          >
            {/* Info */}
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-foreground">{member.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted">{member.phone || "-"}</p>
                  {member.role === "student" && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <span className="font-medium">{balance}</span>
                      <Image
                        src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
                        alt="bánh mì"
                        width={16}
                        height={16}
                        className="inline-block"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
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
    </div>
  );
}
