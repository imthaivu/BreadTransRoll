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
  FiEdit,
  FiEye,
  FiPlus,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
  FiMail,
  FiPhone,
  FiUser,
  FiCalendar,
  FiLink,
  FiRefreshCw,
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
  useTeacher,
  useTeachers,
  useUpdateTeacher,
} from "../hooks/useTeacherManagement";
import { UpdateStudentData } from "../services/student.service";
import { UpdateTeacherData } from "../services/teacher.service";
import { getUserById } from "../services/user.service";
import {
  AdminForm,
  AdminFormField,
  AdminTable,
  AdminTableColumn,
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
  const { data: members = [], isLoading } = useClassMembers(
    classItem.id as unknown as string
  );
  const { mutateAsync: addStudent, isPending: isAdding } =
    useAddStudentToClass();
  const { mutateAsync: removeMember, isPending: isRemoving } =
    useRemoveMemberFromClass();
  const { mutateAsync: updateClassMember } = useUpdateClassMember();

  const { data: allStudents = [] } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [query, setQuery] = useState("");
  const [syncingMemberId, setSyncingMemberId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<IClassMember | null>(
    null
  );

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Vui lòng chọn một học sinh");
      return;
    }
    await addStudent({
      classId: classItem.id as unknown as string,
      studentId: selectedStudentId,
    });
    setSelectedStudentId("");
    setQuery("");
  };

  const filteredStudents =
    query === ""
      ? allStudents
      : allStudents.filter((student) =>
          (student.displayName || student.email || student.phone || "")
            .toLowerCase()
            .includes(query.toLowerCase())
        );

  const buildSyncData = (user: IProfile) => {
    const u = user as Partial<IStudent> & IProfile;
    return {
      name: u.displayName || "N/A",
      email: u.email,
      avatarUrl: u.avatarUrl || "",
      phone: (u as unknown as { phone?: string }).phone || u.parentPhone || "",
    } as Partial<IClassMember>;
  };

  const handleSyncOne = async (member: IClassMember) => {
    try {
      setSyncingMemberId(member.id);
      const user = await getUserById(member.id);
      if (!user) {
        toast.error("Không tìm thấy người dùng để đồng bộ");
        return;
      }
      await updateClassMember({
        classId: classItem.id as unknown as string,
        memberId: member.id,
        data: buildSyncData(user),
      });
      toast.success(`Đã đồng bộ ${member.name}`);
    } catch (e) {
      toast.error("Đồng bộ thất bại. Vui lòng thử lại");
    } finally {
      setSyncingMemberId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      const results = await Promise.all(
        members.map(async (m) => {
          const user = await getUserById(m.id);
          if (user) {
            await updateClassMember({
              classId: classItem.id as unknown as string,
              memberId: m.id,
              data: buildSyncData(user),
            });
          }
        })
      );
      toast.success("Đã đồng bộ tất cả thành viên");
    } catch (e) {
      toast.error("Đồng bộ tất cả thất bại. Vui lòng thử lại");
    } finally {
      setSyncingAll(false);
    }
  };

  if (isLoading) return <p>Đang tải danh sách thành viên...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Thêm học sinh</h4>
        <Button
          variant="outline"
          onClick={handleSyncAll}
          disabled={syncingAll || members.length === 0}
        >
          {syncingAll ? "Đang đồng bộ..." : "Đồng bộ tất cả"}
        </Button>
      </div>
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
                  allStudents.find((s) => s.id === studentId)?.displayName || ""
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
                  filteredStudents.map((student) => (
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
              {allStudents.find((s) => s.id === selectedStudentId)
                ?.displayName ||
                allStudents.find((s) => s.id === selectedStudentId)?.email ||
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
        <h4 className="font-medium mb-2">
          Danh sách thành viên ({members.length})
        </h4>
        {(() => {
          const columns: AdminTableColumn<IClassMember>[] = [
            {
              key: "name",
              title: "Thành viên",
              render: (_, m) => (
                <div className="flex items-center gap-3 min-w-0">
                  {m.avatarUrl ? (
                    <div className="relative h-8 w-8 flex-shrink-0">
                      <Image
                        src={m.avatarUrl}
                        alt={m.name}
                        className="rounded-full object-cover"
                        fill
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {(m.name || m.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {m.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {m.email}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "phone",
              title: "SĐT",
              render: (_, m) => (
                <span className="text-sm">{m.phone || "-"}</span>
              ),
            },
            {
              key: "role",
              title: "Vai trò",
              render: (_, m) => (
                <span
                  className={`text-xs font-semibold ${
                    m.role === "teacher" ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {m.role.toUpperCase()}
                </span>
              ),
            },
            {
              key: "status",
              title: "Trạng thái",
              render: (_, m) => (
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    m.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {m.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              ),
            },
            {
              key: "joinedAt",
              title: "Tham gia",
              render: (_, m) => (
                <span className="text-sm text-gray-600">
                  {m.joinedAt?.toLocaleString?.("vi-VN")}
                </span>
              ),
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (_, m) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSyncOne(m)}
                    disabled={syncingMemberId === m.id}
                    aria-label="Đồng bộ"
                    title="Đồng bộ"
                  >
                    <FiRefreshCw
                      className={syncingMemberId === m.id ? "animate-spin" : ""}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      m.role === "teacher" ? onOpenTeacher(m) : onOpenStudent(m)
                    }
                    aria-label="Chi tiết"
                    title="Chi tiết"
                  >
                    <FiEye />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      m.role === "teacher" ? onOpenTeacher(m) : onOpenStudent(m)
                    }
                    aria-label="Sửa"
                    title="Sửa"
                  >
                    <FiEdit />
                  </Button>
                  {m.role !== "teacher" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setMemberToDelete(m);
                        setConfirmOpen(true);
                      }}
                      disabled={isRemoving}
                      aria-label="Xóa"
                      title="Xóa"
                    >
                      <FiTrash2 className="text-red-500" />
                    </Button>
                  )}
                </div>
              ),
            },
          ];

          return (
            <>
              <AdminTable
                columns={columns}
                data={members}
                loading={isLoading}
                emptyMessage="Chưa có thành viên nào"
                showCheckbox={false}
              />
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
            </>
          );
        })()}
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
  const { mutateAsync: updateTeacher, isPending: isUpdatingTeacher } =
    useUpdateTeacher();
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

  // Tabs
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");

  // Teacher edit modal state
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [activeTeacherMember, setActiveTeacherMember] =
    useState<IClassMember | null>(null);

  // Unified student modal state
  const [activeStudent, setActiveStudent] = useState<IClassMember | null>(null);
  const { data: activeStudentProfile } = useStudent(activeStudent?.id || "");
  const { data: teacherProfile } = useTeacher(teacherId);
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
    .map((t) => ({
      id: t.id,
      name: t.displayName || t.email || "N/A",
      avatarUrl: t.avatarUrl || "",
    }))
    .find((t) => t.id === teacherId);

  const handleSaveClass = async () => {
    if (!name || !teacherId) {
      toast.error("Vui lòng nhập đủ Tên lớp và chọn Giáo viên");
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

  const teacherFormFields: AdminFormField[] = [
    {
      name: "displayName",
      label: "Tên giáo viên",
      type: "text",
      required: true,
    },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Số điện thoại", type: "text" },
    { name: "address", label: "Địa chỉ", type: "text" },
  ];

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
      title={`Chi tiết lớp: ${classItem.name}`}
      size="xl"
    >
      {/* Tabs */}
      <div className="border-b border-border mb-4 flex gap-2">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "info"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("info")}
        >
          Thông tin lớp
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("members")}
        >
          Thành viên lớp
        </button>
      </div>

      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Header overview */}
          <div className="p-4 rounded-lg border border-gray-200 bg-white flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {name || classItem.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100">
                    <span className="font-medium">Mã lớp:</span>
                    <span className="truncate">
                      {classItem.id as unknown as string}
                    </span>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {status === "active" ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {zaloLink && (
                  <a
                    href={zaloLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <FiLink /> Zalo
                  </a>
                )}
                {meetLink && (
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <FiLink /> Meet
                  </a>
                )}
              </div>
            </div>

            {/* Teacher chip */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                {(
                  teachers.find((t) => t.id === teacherId)?.displayName ||
                  teachers.find((t) => t.id === teacherId)?.email ||
                  classItem.teacher?.name ||
                  "?"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {teachers.find((t) => t.id === teacherId)?.displayName ||
                    classItem.teacher?.name ||
                    "(Chưa chọn)"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {teachers.find((t) => t.id === teacherId)?.email || ""}
                </div>
              </div>
            </div>
          </div>

          {/* Body: details + form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Read-only details */}
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="text-base font-semibold">Thông tin chi tiết</h4>
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-500" />
                  <span className="font-medium">Giáo viên hiện tại:</span>
                  <span className="text-gray-700 truncate">
                    {classItem.teacher?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiLink className="text-gray-500" />
                  <span className="font-medium">Zalo:</span>
                  {zaloLink || classItem.links?.zalo ? (
                    <a
                      href={(zaloLink || classItem.links?.zalo) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      Mở liên kết
                    </a>
                  ) : (
                    <span className="text-gray-500">(chưa có)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FiLink className="text-gray-500" />
                  <span className="font-medium">Meet:</span>
                  {meetLink || classItem.links?.meet ? (
                    <a
                      href={(meetLink || classItem.links?.meet) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      Mở liên kết
                    </a>
                  ) : (
                    <span className="text-gray-500">(chưa có)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-500" />
                  <span className="font-medium">Tạo lúc:</span>
                  <span className="text-gray-700">
                    {classItem.createdAt?.toLocaleString?.("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-500" />
                  <span className="font-medium">Cập nhật lúc:</span>
                  <span className="text-gray-700">
                    {classItem.updatedAt?.toLocaleString?.("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="text-base font-semibold mb-2">
                Chỉnh sửa thông tin
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tên lớp
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 p-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên lớp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClassStatus)}
                  >
                    <option value={ClassStatus.ACTIVE}>Hoạt động</option>
                    <option value={ClassStatus.INACTIVE}>Tạm dừng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Giáo viên
                  </label>
                  <div className="flex items-end gap-2">
                    <select
                      className="mt-1 w-full rounded-md border border-gray-300 p-2"
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
                    {teacherId && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditTeacherOpen(true)}
                      >
                        <FiEdit className="mr-2" /> Sửa GV
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Link Zalo
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 p-2"
                    value={zaloLink}
                    onChange={(e) => setZaloLink(e.target.value)}
                    placeholder="https://zalo.me/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Link Meet
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 p-2"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              <div className="pt-3">
                <Button onClick={handleSaveClass} disabled={isSaving}>
                  <FiSave className="mr-2" />{" "}
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-6">
          <MemberManager
            classItem={classItem}
            onOpenStudent={(member) => setActiveStudent(member)}
            onOpenTeacher={(member) => {
              setActiveTeacherMember(member);
              setIsEditTeacherOpen(true);
            }}
          />
        </div>
      )}

      {/* Edit Teacher Modal (details + form) */}
      {teacherId && (
        <AdminModal
          isOpen={isEditTeacherOpen}
          onClose={() => setIsEditTeacherOpen(false)}
          title="Chi tiết / Sửa giáo viên"
          size="2xl"
        >
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="relative h-12 w-12 flex-shrink-0">
              {((teacherProfile as IStudent | undefined)?.avatarUrl && (
                <Image
                  src={
                    (teacherProfile as IStudent | undefined)?.avatarUrl || ""
                  }
                  alt={
                    (teacherProfile as IStudent | undefined)?.displayName ||
                    "GV"
                  }
                  className="rounded-full object-cover"
                  fill
                />
              )) || (
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                  {(
                    (teacherProfile as IStudent | undefined)?.displayName ||
                    (teacherProfile as IStudent | undefined)?.email ||
                    "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-900 truncate">
                {(teacherProfile as IStudent | undefined)?.displayName ||
                  "(Chưa có tên)"}
              </div>
              <div className="text-sm text-gray-600 truncate flex items-center gap-2">
                <FiMail /> {(teacherProfile as IStudent | undefined)?.email}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-1">Thông tin chi tiết</h4>
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-500" />
                  <span className="font-medium">Tên:</span>
                  <span className="text-gray-700">
                    {(teacherProfile as IStudent | undefined)?.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMail className="text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="text-gray-700">
                    {(teacherProfile as IStudent | undefined)?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone className="text-gray-500" />
                  <span className="font-medium">Số điện thoại:</span>
                  <span className="text-gray-700">
                    {(teacherProfile as IStudent | undefined)?.phone ||
                      "(chưa có)"}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-2">Sửa thông tin</h4>
              <AdminForm
                fields={teacherFormFields}
                defaultValues={
                  {
                    displayName:
                      (teacherProfile as IStudent | undefined)?.displayName ||
                      "",
                    email:
                      (teacherProfile as IStudent | undefined)?.email || "",
                    phone:
                      (teacherProfile as IStudent | undefined)?.phone || "",
                    address: undefined,
                  } as Record<string, unknown>
                }
                onSubmit={async (data: UpdateTeacherData) => {
                  // 1) Update teacher profile
                  await updateTeacher({ teacherId, teacherData: data });
                  // 2) Refetch latest teacher and update class teacher field
                  const updated = await getUserById(teacherId);
                  if (updated) {
                    await updateClass({
                      classId: classItem.id as unknown as string,
                      classData: {
                        teacher: {
                          id: teacherId,
                          name:
                            (updated as IProfile).displayName ||
                            (updated as IProfile).email ||
                            "N/A",
                          avatarUrl: (updated as IProfile).avatarUrl || "",
                          phone:
                            (updated as unknown as { phone?: string }).phone ||
                            "",
                        } as IClassTeacher,
                      },
                    });
                    // 3) Best-effort sync teacher member row
                    await updateClassMember({
                      classId: classItem.id as unknown as string,
                      memberId: teacherId,
                      data: {
                        name: (updated as IProfile).displayName || "N/A",
                        email: (updated as IProfile).email,
                        avatarUrl: (updated as IProfile).avatarUrl || "",
                        phone:
                          (updated as unknown as { phone?: string }).phone ||
                          "",
                      },
                    });
                  }
                  toast.success("Đã lưu thông tin giáo viên");
                  setIsEditTeacherOpen(false);
                }}
                isLoading={isUpdatingTeacher}
                onCancel={() => setIsEditTeacherOpen(false)}
                submitText="Lưu"
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* Unified Student Detail/Edit Modal */}
      {activeStudent && (
        <AdminModal
          isOpen={!!activeStudent}
          onClose={() => setActiveStudent(null)}
          title="Chi tiết / Sửa học sinh"
          size="2xl"
        >
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="relative h-12 w-12 flex-shrink-0">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details (from member doc) */}
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-1">Thông tin chi tiết</h4>
              <div className="text-sm space-y-2">
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
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-2">Sửa thông tin</h4>
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
