import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  CreateUserData,
  UpdateUserData,
} from "../services/user.service";
import toast from "react-hot-toast";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

// Get all users
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get user by ID
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Add the new user to the cache
      queryClient.setQueryData(userKeys.detail(newUser.id), newUser);

      toast.success("Tạo người dùng thành công!");
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast.error("Tạo người dùng thất bại!");
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: UpdateUserData;
    }) => updateUser(userId, userData),
    onSuccess: (_, { userId }) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Invalidate specific user detail
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });

      toast.success("Cập nhật người dùng thành công!");
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast.error("Cập nhật người dùng thất bại!");
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, userId) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Remove user from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });

      toast.success("Xóa người dùng thành công!");
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("Xóa người dùng thất bại!");
    },
  });
};

// Custom hook for user management
export const useUserManagement = () => {
  // Get users
  const { data: users = [], isLoading, error } = useUsers();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // CRUD functions
  const handleCreateUser = async (userData: CreateUserData) => {
    return createUserMutation.mutateAsync(userData);
  };

  const handleUpdateUser = async (userId: string, userData: UpdateUserData) => {
    return updateUserMutation.mutateAsync({ userId, userData });
  };

  const handleDeleteUser = async (userId: string) => {
    return deleteUserMutation.mutateAsync(userId);
  };

  return {
    // Data
    users,
    isLoading,
    error,

    // CRUD operations
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,

    // Mutation states
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
};
