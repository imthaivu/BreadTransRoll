"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/context";
import { IClass, IClassMember } from "@/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiMinusCircle, FiPlusCircle, FiUser } from "react-icons/fi";
import {
  useClassDetails,
  useClassMembers,
  useCreateCurrencyRequest,
} from "../hooks";

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
  const {
    register,
    handleSubmit,
    reset,
    setValue, // Get setValue from react-hook-form
    formState: { errors },
  } = useForm<{ amount: number; reason: string }>();
  const { mutate: createRequest, isPending } = useCreateCurrencyRequest();

  const quickAmounts = [5, 10, 20, 30, 50];

  const onSubmit = (data: { amount: number; reason: string }) => {
    if (!session?.user) return;

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
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-2">
            Số lượng
          </label>
          <div className="flex items-center gap-2 mb-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setValue("amount", amount, { shouldValidate: true })
                }
              >
                {amount}
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
            })}
            className="mt-1 block w-full p-2 border rounded-md"
            min="1"
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
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
  const [requestModal, setRequestModal] = useState<{
    member: IClassMember;
    type: "add" | "subtract";
  } | null>(null);

  if (isLoading) return <p>Đang tải danh sách thành viên...</p>;
  if (error) return <p className="text-red-500">Lỗi tải danh sách.</p>;

  return (
    <div className="space-y-3">
      {members?.map((member) => (
        <div
          key={member.id}
          className="flex md:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex-col md:flex-row gap-2"
        >
          {/* Info */}
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-foreground">{member.name}</p>
              <p className="text-xs text-muted">{member.phone || "-"}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {member.role === "student" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRequestModal({ member, type: "add" })}
                  title="Cộng bánh mì"
                >
                  <FiPlusCircle className="h-5 w-5 text-green-500" />
                  <span className="ml-1">Cộng</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRequestModal({ member, type: "subtract" })}
                  title="Trừ bánh mì"
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
      ))}
      {requestModal && classDetails && (
        <CurrencyRequestModal
          isOpen={!!requestModal}
          onClose={() => setRequestModal(null)}
          member={requestModal.member}
          type={requestModal.type}
          classDetails={classDetails}
        />
      )}
    </div>
  );
}
