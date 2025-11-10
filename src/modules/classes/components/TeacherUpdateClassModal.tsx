"use client";

import { Button } from "@/components/ui/Button";
import { AdminModal } from "@/modules/admin";
import { IClass } from "@/types";
import { useState, useEffect } from "react";
import { FiLink, FiSave, FiFileText } from "react-icons/fi";
import { useUpdateClassLinks } from "../hooks";
import toast from "react-hot-toast";

interface TeacherUpdateClassModalProps {
  classItem: IClass;
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherUpdateClassModal({
  classItem,
  isOpen,
  onClose,
}: TeacherUpdateClassModalProps) {
  const [zaloLink, setZaloLink] = useState(classItem.links?.zalo || "");
  const [meetLink, setMeetLink] = useState(classItem.links?.meet || "");
  const [noteProcess, setNoteProcess] = useState(classItem.noteProcess || "");
  const { mutateAsync: updateLinks, isPending } = useUpdateClassLinks();

  useEffect(() => {
    setZaloLink(classItem.links?.zalo || "");
    setMeetLink(classItem.links?.meet || "");
    setNoteProcess(classItem.noteProcess || "");
  }, [classItem]);

  const handleSave = async () => {
    try {
      await updateLinks({
        classId: classItem.id,
        links: {
          zalo: zaloLink,
          meet: meetLink,
        },
        noteProcess: noteProcess,
      });
      toast.success("Cập nhật thành công!");
      onClose();
    } catch (error) {
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cập nhật lớp: ${classItem.name}`}
      size="lg"
    >
      <div className="space-y-4 p-2">
        <div>
          <label
            htmlFor="zaloLink"
            className="block text-sm font-medium text-gray-700"
          >
            <FiLink className="inline mr-2" />
            Link Zalo
          </label>
          <input
            type="text"
            id="zaloLink"
            value={zaloLink}
            onChange={(e) => setZaloLink(e.target.value)}
            placeholder="https://zalo.me/..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="meetLink"
            className="block text-sm font-medium text-gray-700"
          >
            <FiLink className="inline mr-2" />
            Link Google Meet
          </label>
          <input
            type="text"
            id="meetLink"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="noteProcess"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <FiFileText className="inline mr-2" />
            Ghi chú quá trình học tập
          </label>
          <textarea
            id="noteProcess"
            value={noteProcess}
            onChange={(e) => setNoteProcess(e.target.value)}
            placeholder="Nhập ghi chú về quá trình học tập của lớp..."
            rows={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ghi chú này chỉ có giáo viên và admin mới có thể xem và chỉnh sửa.
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isPending}>
            <FiSave className="mr-2" />
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </AdminModal>
  );
}
