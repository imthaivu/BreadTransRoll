"use client";

import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ClassStatus, IClass, IClassTeacher } from "@/modules/admin";
import { IClassMember, IProfile, IStudent } from "@/types";
import { Combobox } from "@headlessui/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheck,
  FiChevronDown,
  FiPlus,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
  FiMail,
  FiPhone,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import {
  useAddStudentToClass,
  useClassMembers,
  useRemoveMemberFromClass,
  useUpdateClass,
  useUpdateClassMember,
} from "../hooks/useClassManagement";
import {
  useStudent,
  useStudents,
  useUpdateStudent,
} from "../hooks/useStudentManagement";
import {
  useTeachers,
} from "../hooks/useTeacherManagement";
import { UpdateStudentData } from "../services/student.service";
import {
  AdminForm,
  AdminFormField,
} from "./common";
import AdminModal from "./common/AdminModal";
import Image from "next/image";

interface ClassDetailModalProps {
  classItem: IClass;
  isOpen: boolean;
  onClose: () => void;
}

// Sub-component for managing members
function MemberManager({
  classItem,
  onOpenStudent,
  onOpenTeacher,
}: {
  classItem: IClass;
  onOpenStudent: (member: IClassMember) => void;
  onOpenTeacher: (member: IClassMember) => void;
}) {
  const { data: members = [] } = useClassMembers(
    classItem.id as unknown as string
  );
  const { mutateAsync: addStudent, isPending: isAdding } =
    useAddStudentToClass();
  const { mutateAsync: removeMember, isPending: isRemoving } =
    useRemoveMemberFromClass();

  const { data: studentsData } = useStudents();
  const allStudents = studentsData?.data || [];
  // Filter out students already in the class
  const memberIds = new Set(members.map((m) => m.id));
  const availableStudents = allStudents.filter(
    (student) => !memberIds.has(student.id)
  );
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<IClassMember | null>(
    null
  );

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Vui lòng chọn một học sinh");
      return;
    }
    try {
      await addStudent({
        classId: classItem.id as unknown as string,
        studentId: selectedStudentId,
      });
      toast.success("Đã thêm học sinh vào lớp");
      setSelectedStudentId("");
      setQuery("");
    } catch (error) {
      toast.error("Thêm học sinh thất bại. Vui lòng thử lại.");
    }
  };

  const filteredStudents =
    query === ""
      ? availableStudents
      : availableStudents.filter((student: IStudent) =>
          (student.displayName || student.email || student.phone || "")
            .toLowerCase()
            .includes(query.toLowerCase())
        );



  return (
    <div className="space-y-3 sm:space-y-4">
      <h4 className="text-sm sm:text-base font-medium">Thêm học sinh</h4>
      <div className="space-y-2">
        <div className="relative">
          {/* Search icon */}
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Combobox
            value={selectedStudentId}
            onChange={(value) => setSelectedStudentId(value || "")}
          >
            <div className="relative">
              <Combobox.Input
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(studentId) =>
                  allStudents.find((s: IStudent) => s.id === studentId)?.displayName || ""
                }
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                className="w-full rounded-md border border-gray-300 pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Combobox.Button className="absolute inset-y-0 right-0 px-3 text-gray-500">
                <FiChevronDown />
              </Combobox.Button>

              <Combobox.Options className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredStudents.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Không tìm thấy học sinh phù hợp
                  </div>
                ) : (
                  filteredStudents.map((student: IStudent) => (
                    <Combobox.Option key={student.id} value={student.id}>
                      {({ active }) => (
                        <div
                          className={`px-3 py-2 flex items-center justify-between ${
                            active ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {(student.displayName || student.email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {student.displayName || "Chưa có tên"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {student.email}
                                {student.phone ? ` · ${student.phone}` : ""}
                              </div>
                            </div>
                          </div>
                          {selectedStudentId === student.id && (
                            <FiCheck className="text-green-600" />
                          )}
                        </div>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        {selectedStudentId && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Đã chọn:</span>
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100">
              {allStudents.find((s: IStudent) => s.id === selectedStudentId)
                ?.displayName ||
                allStudents.find((s: IStudent) => s.id === selectedStudentId)?.email ||
                selectedStudentId}
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedStudentId("")}
                aria-label="Bỏ chọn"
              >
                <FiX />
              </button>
            </span>
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button
            onClick={handleAddStudent}
            disabled={isAdding || !selectedStudentId}
          >
            <FiPlus className="mr-2" />{" "}
            {isAdding ? "Đang thêm..." : "Thêm vào lớp"}
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm sm:text-base font-medium mb-2">
          Danh sách thành viên ({members.length})
        </h4>
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có thành viên nào</p>
        ) : (
          <div className="space-y-2">
            {members.map((member: IClassMember) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {member.phone || "-"}
                  </div>
                </div>
                {member.role !== "teacher" && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setMemberToDelete(member);
                      setConfirmOpen(true);
                    }}
                    disabled={isRemoving}
                    aria-label="Xóa"
                    title="Xóa"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FiTrash2 />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            if (!memberToDelete) return;
            await removeMember({
              classId: classItem.id as unknown as string,
              memberId: memberToDelete.id,
            });
            toast.success("Đã xóa thành viên khỏi lớp");
            setMemberToDelete(null);
          }}
          title="Xác nhận xóa thành viên"
          message={`Bạn có chắc muốn xóa "${
            memberToDelete?.name || "thành viên"
          }" khỏi lớp?`}
          confirmText="Xóa"
          cancelText="Hủy"
          confirmVariant="warning"
        />
      </div>
    </div>
  );
}

export function ClassDetailModal({
  classItem,
  isOpen,
  onClose,
}: ClassDetailModalProps) {
  const { mutateAsync: updateClass, isPending: isSaving } = useUpdateClass();
  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachers();
  const { data: members = [] } = useClassMembers(
    classItem.id as unknown as string
  );
  const { mutateAsync: updateStudent, isPending: isUpdatingStudent } =
    useUpdateStudent();
  const { mutateAsync: updateClassMember } = useUpdateClassMember();

  const [name, setName] = useState<string>(classItem.name);
  const [status, setStatus] = useState<ClassStatus>(classItem.status);
  const [teacherId, setTeacherId] = useState<string>(
    classItem.teacher?.id || ""
  );
  const [zaloLink, setZaloLink] = useState<string>(classItem.links?.zalo || "");
  const [meetLink, setMeetLink] = useState<string>(classItem.links?.meet || "");



  // Unified student modal state
  const [activeStudent, setActiveStudent] = useState<IClassMember | null>(null);
  const { data: activeStudentProfile } = useStudent(activeStudent?.id || "");
  const [memberStatus, setMemberStatus] = useState<"active" | "inactive">(
    "active"
  );

  useEffect(() => {
    setName(classItem.name);
    setStatus(classItem.status);
    setTeacherId(classItem.teacher?.id || "");
    setZaloLink(classItem.links?.zalo || "");
    setMeetLink(classItem.links?.meet || "");
  }, [classItem]);

  useEffect(() => {
    if (activeStudent) {
      setMemberStatus(activeStudent.status as "active" | "inactive");
    }
  }, [activeStudent]);

  const selectedTeacher: IClassTeacher | undefined = teachers
    .map((t) => {
      const teacherWithImage = t as IProfile & { image?: string };
      return {
        id: t.id,
        name: t.displayName || t.email || "N/A",
        avatarUrl: t.avatarUrl || teacherWithImage.image || "",
        phone: (t as unknown as { phone?: string }).phone || "",
      };
    })
    .find((t) => t.id === teacherId);

  const handleSaveClass = async () => {
    if (!name || !teacherId) {
      toast.error("Vui lòng nhập đủ Tên lớp và chọn Giáo viên");
      return;
    }
    
    if (!selectedTeacher) {
      toast.error("Vui lòng chọn giáo viên hợp lệ");
      return;
    }
    
    await updateClass({
      classId: classItem.id as unknown as string,
      classData: {
        name,
        zaloLink,
        meetLink,
        status,
        teacher: selectedTeacher,
      },
    });
    toast.success("Đã lưu thay đổi lớp học");
  };

  const studentFormFields: AdminFormField[] = [
    {
      name: "displayName",
      label: "Tên",
      type: "text",
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
    },
    { name: "phone", label: "Số điện thoại", type: "text" },
  ];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết lớp`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="space-y-4">
          {/* Header with class name and status */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {name || classItem.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form - Single column, clean layout */}
          <div className="space-y-4">
            {/* Tên lớp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên lớp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên lớp"
              />
            </div>

            {/* Trạng thái và Giáo viên - Side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trạng thái
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClassStatus)}
                >
                  <option value={ClassStatus.ACTIVE}>Hoạt động</option>
                  <option value={ClassStatus.INACTIVE}>Tạm dừng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Giáo viên <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    disabled={isLoadingTeachers}
                  >
                    <option value="">-- Chọn giáo viên --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(t.displayName || t.email) as string}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Links - Side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Link Zalo
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={zaloLink}
                  onChange={(e) => setZaloLink(e.target.value)}
                  placeholder="https://zalo.me/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Link Meet
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>

            {/* Metadata - Read only info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <span>Tạo lúc: <span className="text-gray-900">{classItem.createdAt?.toLocaleString?.("vi-VN")}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <span>Cập nhật: <span className="text-gray-900">{classItem.updatedAt?.toLocaleString?.("vi-VN")}</span></span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <Button 
                onClick={handleSaveClass} 
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                <FiSave className="mr-2" />
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>

            {/* Thêm học sinh vào lớp */}
            <div className="pt-6 border-t border-gray-200">
              <MemberManager
                classItem={classItem}
                onOpenStudent={(member) => setActiveStudent(member)}
                onOpenTeacher={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Unified Student Detail/Edit Modal */}
      {activeStudent && (
        <AdminModal
          isOpen={!!activeStudent}
          onClose={() => setActiveStudent(null)}
          title="Chi tiết / Sửa học sinh"
          size="2xl"
        >
          {/* Profile header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              {(activeStudent.avatarUrl && (
                <Image
                  src={activeStudent.avatarUrl}
                  alt={activeStudent.name}
                  className="rounded-full object-cover"
                  fill
                />
              )) || (
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                  {(activeStudent.name || activeStudent.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900 truncate">
                {activeStudent.name}
              </div>
              <div className="text-sm text-gray-600 truncate flex items-center gap-2">
                <FiMail /> {activeStudent.email}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {activeStudent.role.toUpperCase()}
              </span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  activeStudent.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {activeStudent.status === "active" ? "Hoạt động" : "Tạm dừng"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Details (from member doc) */}
            <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="text-sm sm:text-base font-semibold mb-1">Thông tin chi tiết</h4>
              <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-500" />
                  <span className="font-medium">Tên:</span>
                  <span className="text-gray-700">{activeStudent.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMail className="text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="text-gray-700">{activeStudent.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone className="text-gray-500" />
                  <span className="font-medium">Số điện thoại:</span>
                  <span className="text-gray-700">
                    {activeStudent.phone || "(chưa có)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-500" />
                  <span className="font-medium">Vai trò:</span>
                  <span className="text-gray-700">{activeStudent.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-500" />
                  <span className="font-medium">Tham gia lúc:</span>
                  <span className="text-gray-700">
                    {activeStudent.joinedAt?.toLocaleString?.("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit form (user profile) */}
            <div className="p-3 sm:p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="text-sm sm:text-base font-semibold mb-2">Sửa thông tin</h4>
              <AdminForm
                fields={studentFormFields}
                defaultValues={
                  {
                    displayName:
                      (activeStudentProfile as IStudent | undefined)
                        ?.displayName ||
                      activeStudent.name ||
                      "",
                    email:
                      (activeStudentProfile as IStudent | undefined)?.email ||
                      activeStudent.email ||
                      "",
                    phone:
                      (activeStudentProfile as IStudent | undefined)?.phone ||
                      activeStudent.phone ||
                      "",
                  } as Record<string, unknown>
                }
                onSubmit={async (data: UpdateStudentData) => {
                  // Update user profile
                  await updateStudent({
                    studentId: activeStudent.id,
                    studentData: data,
                  });
                  // Best-effort sync denormalized member fields
                  await updateClassMember({
                    classId: classItem.id as unknown as string,
                    memberId: activeStudent.id,
                    data: {
                      name: (data.displayName as string) || activeStudent.name,
                      email: (data.email as string) || activeStudent.email,
                      phone: (data.phone as string) || activeStudent.phone,
                    },
                  });
                  toast.success("Đã lưu thông tin học sinh");
                  setActiveStudent(null);
                }}
                isLoading={isUpdatingStudent}
                onCancel={() => setActiveStudent(null)}
                submitText="Lưu"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </AdminModal>
  );
}
