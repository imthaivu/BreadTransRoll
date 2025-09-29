"use client";

import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useState } from "react";
import { FiEye, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
} from "../hooks/useClassManagement";
import { useTeachers } from "../hooks/useTeacherManagement";
import { ClassStatus, IClass } from "../type";
import { ClassDetailModal } from "./ClassDetailModal";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";
import { useMemo } from "react";

export default function AdminClasses() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<IClass | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Filters
  const [classNameFilter, setClassNameFilter] = useState("");
  const [teacherNameFilter, setTeacherNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClassStatus>("all");

  // Use the new hooks
  const { data: classes = [], isLoading, error } = useClasses();
  const { mutateAsync: createClass, isPending: isCreating } = useCreateClass();
  const { mutateAsync: deleteClass, isPending: isDeleting } = useDeleteClass();

  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachers();

  // Apply filters
  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const classNameMatch =
        !classNameFilter ||
        classItem.name.toLowerCase().includes(classNameFilter.toLowerCase());
      const teacherNameMatch =
        !teacherNameFilter ||
        classItem.teacher.name
          .toLowerCase()
          .includes(teacherNameFilter.toLowerCase());
      const statusMatch =
        statusFilter === "all" || classItem.status === statusFilter;
      return classNameMatch && teacherNameMatch && statusMatch;
    });
  }, [classes, classNameFilter, teacherNameFilter, statusFilter]);

  const handleCreateClass = async (data: {
    name: string;
    teacherId: string;
    zaloLink?: string;
    meetLink?: string;
    status: ClassStatus;
  }) => {
    await createClass(data);
    setIsCreateModalOpen(false);
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    await deleteClass(selectedClass.id);
    setIsDeleteModalOpen(false);
    setSelectedClass(null);
  };

  const openDeleteModal = (classItem: IClass) => {
    setSelectedClass(classItem);
    setConfirmOpen(true);
  };

  const openDetailModal = (classItem: IClass) => {
    setSelectedClass(classItem);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedClass(null);
  };

  // Table columns configuration
  const columns: AdminTableColumn<IClass>[] = [
    {
      key: "class",
      title: "Lớp học",
      render: (_, classItem) => (
        <div className="flex items-center">
          <div className="ml-4">
            <div className="text-sm md:text-base font-medium text-gray-900">
              {classItem.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "teacher",
      title: "Giáo viên",
      render: (_, classItem) => (
        <div className="text-sm md:text-base text-gray-900">
          <div className="font-medium">{classItem.teacher.name}</div>
          {classItem.teacher.phone && (
            <div className="text-xs text-gray-500">
              📞 {classItem.teacher.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "links",
      title: "Liên kết",
      render: (_, classItem) => (
        <div className="flex space-x-2">
          {classItem.links.zalo && (
            <a
              href={classItem.links.zalo}
              target="_blank"
              rel="noopener noreferrer"
            >
              Zalo
            </a>
          )}
          {classItem.links.meet && (
            <a
              href={classItem.links.meet}
              target="_blank"
              rel="noopener noreferrer"
            >
              Meet
            </a>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (_, classItem) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            classItem.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {classItem.status === "active" ? "Hoạt động" : "Tạm dừng"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, classItem) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDetailModal(classItem)}
          >
            <FiEye className="w-3 h-3 mr-2" />
            Chi tiết/Sửa
          </Button>
          <Button
            className="text-red-600 hover:text-red-700"
            variant="outline"
            size="sm"
            onClick={() => openDeleteModal(classItem)}
          >
            <FiTrash2 className="w-3 h-3 mr-2 " />
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  // Form fields configuration
  const formFields: AdminFormField[] = [
    { name: "name", label: "Tên lớp học", type: "text", required: true },
    {
      name: "teacherId",
      label: "Giáo viên",
      type: "select",
      required: true,
      options: isLoadingTeachers
        ? [{ value: "", label: "Đang tải..." }]
        : teachers.map((teacher) => ({
            value: teacher.id,
            label: `${teacher.displayName || "Chưa có tên"} (${
              teacher.email
            }) ${teacher.phone ? `- ${teacher.phone}` : ""}`,
          })),
    },
    { name: "zaloLink", label: "Link Zalo", type: "text" },
    { name: "meetLink", label: "Link Google Meet", type: "text" },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: [
        { value: "active", label: "Hoạt động" },
        { value: "inactive", label: "Tạm dừng" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lớp học</h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <FiPlus />
          Tạo lớp học
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Lọc theo tên lớp..."
          value={classNameFilter}
          onChange={(e) => setClassNameFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <input
          type="text"
          placeholder="Lọc theo tên giáo viên..."
          value={teacherNameFilter}
          onChange={(e) => setTeacherNameFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | ClassStatus)
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={filteredClasses}
        loading={isLoading}
      />

      {/* Create Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title="Tạo lớp học mới"
      >
        <AdminForm
          fields={formFields}
          defaultValues={{
            name: "",
            teacherId: "",
            zaloLink: "",
            meetLink: "",
            status: "active",
          }}
          onSubmit={handleCreateClass}
          isLoading={isCreating}
          onCancel={closeModal}
          submitText="Tạo lớp học"
        />
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteClass}
        title="Xác nhận xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${
          selectedClass?.name || ""
        }" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="warning"
      />

      {/* Class Detail/Edit Modal */}
      {selectedClass && isDetailModalOpen && (
        <ClassDetailModal
          classItem={selectedClass}
          isOpen={isDetailModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
