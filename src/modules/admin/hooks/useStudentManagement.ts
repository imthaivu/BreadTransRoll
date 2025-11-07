import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  CreateStudentData,
  UpdateStudentData,
} from "../services/student.service";
import toast from "react-hot-toast";

// Query keys
export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (options?: { page?: number; limit?: number; classId?: string; searchKeyword?: string }) => 
    [...studentKeys.lists(), options] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
};

// Get all students with pagination and search
export const useStudents = (options?: {
  page?: number;
  limit?: number;
  classId?: string;
  searchKeyword?: string;
}) => {
  return useQuery({
    queryKey: studentKeys.list(options),
    queryFn: () => getStudents(options),
    enabled: true, // Always fetch students
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get student by ID
export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: studentKeys.detail(studentId),
    queryFn: () => getStudentById(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};

// Create student mutation
export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: (newStudent) => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });

      // Add the new student to the cache
      queryClient.setQueryData(studentKeys.detail(newStudent.id), newStudent);

      toast.success("Tạo học sinh thành công!");
    },
    onError: (error) => {
      console.error("Error creating student:", error);
      toast.error("Tạo học sinh thất bại!");
    },
  });
};

// Update student mutation
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      studentData,
    }: {
      studentId: string;
      studentData: UpdateStudentData;
    }) => updateStudent(studentId, studentData),
    onSuccess: (_, { studentId }) => {
      // Invalidate and refetch all students lists (with any limit)
      queryClient.invalidateQueries({ 
        queryKey: studentKeys.lists(),
        exact: false // Invalidate all queries that start with this key
      });

      // Invalidate specific student detail
      queryClient.invalidateQueries({
        queryKey: studentKeys.detail(studentId),
      });

      toast.success("Cập nhật học sinh thành công!");
    },
    onError: (error) => {
      console.error("Error updating student:", error);
      toast.error("Cập nhật học sinh thất bại!");
    },
  });
};

// Delete student mutation
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: (_, studentId) => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });

      // Remove student from cache
      queryClient.removeQueries({ queryKey: studentKeys.detail(studentId) });

      toast.success("Xóa học sinh thành công!");
    },
    onError: (error) => {
      console.error("Error deleting student:", error);
      toast.error("Xóa học sinh thất bại!");
    },
  });
};

// Custom hook for student management
export const useStudentManagement = (options?: {
  page?: number;
  limit?: number;
  classId?: string;
  searchKeyword?: string;
}) => {
  // Get students with pagination
  const { data, isLoading, error } = useStudents(options);
  const students = data?.data || [];
  const pagination = data?.pagination;

  // Mutations
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  // CRUD functions
  const handleCreateStudent = async (studentData: CreateStudentData) => {
    return createStudentMutation.mutateAsync(studentData);
  };

  const handleUpdateStudent = async (
    studentId: string,
    studentData: UpdateStudentData
  ) => {
    return updateStudentMutation.mutateAsync({ studentId, studentData });
  };

  const handleDeleteStudent = async (studentId: string) => {
    return deleteStudentMutation.mutateAsync(studentId);
  };

  return {
    // Data
    students,
    pagination,
    isLoading,
    error,

    // CRUD operations
    createStudent: handleCreateStudent,
    updateStudent: handleUpdateStudent,
    deleteStudent: handleDeleteStudent,

    // Mutation states
    isCreating: createStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending,
  };
};
