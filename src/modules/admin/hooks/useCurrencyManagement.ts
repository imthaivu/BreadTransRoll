import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CreateCurrencyData,
  createCurrencyTransaction,
  deleteCurrencyTransaction,
  getCurrencyRequests,
  getCurrencyStats,
  getCurrencyTransactionById,
  getCurrencyTransactions,
  getCurrencyTransactionsByDate,
  getCurrencyTransactionsByStudent,
  getStudentBalance,
  updateCurrencyRequestStatus,
} from "../services/currency.service";
import { studentKeys } from "./useStudentManagement";
import { CurrencyRequestStatus } from "@/types";

// Query keys
export const currencyKeys = {
  all: ["currency"] as const,
  lists: () => [...currencyKeys.all, "list"] as const,
  detail: (id: string) => [...currencyKeys.all, "detail", id] as const,
  byStudent: (studentId: string) =>
    [...currencyKeys.all, "student", studentId] as const,
  balance: (studentId: string) =>
    [...currencyKeys.all, "balance", studentId] as const,
  requests: (status?: CurrencyRequestStatus) =>
    [...currencyKeys.all, "requests", { status }] as const,
  stats: () => [...currencyKeys.all, "stats"] as const,
};

// Get all currency transactions
export const useCurrencyTransactions = (forDate?: Date) => {
  return useQuery({
    queryKey: [...currencyKeys.lists(), { forDate: forDate?.toDateString?.() }],
    queryFn: () =>
      forDate
        ? getCurrencyTransactionsByDate(forDate)
        : getCurrencyTransactions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCurrencyStats = () => {
  return useQuery({
    queryKey: currencyKeys.stats(),
    queryFn: getCurrencyStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get currency transactions by student
export const useCurrencyTransactionsByStudent = (studentId: string) => {
  return useQuery({
    queryKey: currencyKeys.byStudent(studentId),
    queryFn: () => getCurrencyTransactionsByStudent(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get currency transaction by ID
export const useCurrencyTransaction = (transactionId: string) => {
  return useQuery({
    queryKey: currencyKeys.detail(transactionId),
    queryFn: () => getCurrencyTransactionById(transactionId),
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get student balance
export const useStudentBalance = (studentId: string) => {
  return useQuery({
    queryKey: currencyKeys.balance(studentId),
    queryFn: () => getStudentBalance(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};

// =============================================
// REQUESTS HOOKS
// =============================================

export const useCurrencyRequests = (
  status?: CurrencyRequestStatus,
  forDate?: Date
) => {
  return useQuery({
    queryKey: [
      ...currencyKeys.requests(status),
      { forDate: forDate?.toDateString?.() },
    ],
    queryFn: () => getCurrencyRequests(status, forDate),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUpdateCurrencyRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrencyRequestStatus,
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: currencyKeys.requests("approved"),
      });
      queryClient.invalidateQueries({
        queryKey: currencyKeys.requests("pending"),
      });
      queryClient.invalidateQueries({
        queryKey: currencyKeys.requests("rejected"),
      });
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: currencyKeys.balance("ALL") }); // A bit hacky, but need to refetch balances

      toast.success("Yêu cầu đã được cập nhật.");
    },
    onError: (error) => {
      console.error("Error updating currency request:", error);
      toast.error(error.message || "Cập nhật yêu cầu thất bại.");
    },
  });
};

// Create currency transaction mutation
export const useCreateCurrencyTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCurrencyTransaction,
    onSuccess: (newTransaction) => {
      // Invalidate and refetch currency transactions list
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });

      // Invalidate student-specific queries
      queryClient.invalidateQueries({
        queryKey: currencyKeys.byStudent(newTransaction.studentId),
      });
      queryClient.invalidateQueries({
        queryKey: currencyKeys.balance(newTransaction.studentId),
      });

      // Invalidate students list to update totalBanhRan
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });

      // Add the new transaction to the cache
      queryClient.setQueryData(
        currencyKeys.detail(newTransaction.id),
        newTransaction
      );

      toast.success("Thêm bánh rán thành công!");
    },
    onError: (error) => {
      console.error("Error creating currency transaction:", error);
      toast.error(error.message || "Thêm bánh rán thất bại!");
    },
  });
};

// Delete currency transaction mutation
export const useDeleteCurrencyTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCurrencyTransaction,
    onSuccess: (_, transactionId) => {
      // Invalidate and refetch currency transactions list
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists() });

      // Remove transaction from cache
      queryClient.removeQueries({
        queryKey: currencyKeys.detail(transactionId),
      });

      // Invalidate students list to update totalBanhRan
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });

      toast.success("Xóa bánh rán thành công!");
    },
    onError: (error) => {
      console.error("Error deleting currency transaction:", error);
      toast.error("Xóa bánh rán thất bại!");
    },
  });
};

// Custom hook for currency management
export const useCurrencyManagement = () => {
  // Get currency transactions
  const {
    data: transactions = [],
    isLoading,
    error,
  } = useCurrencyTransactions();

  // Mutations
  const createTransactionMutation = useCreateCurrencyTransaction();
  const deleteTransactionMutation = useDeleteCurrencyTransaction();

  // CRUD functions
  const handleCreateTransaction = async (
    transactionData: CreateCurrencyData
  ) => {
    return createTransactionMutation.mutateAsync(transactionData);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    return deleteTransactionMutation.mutateAsync(transactionId);
  };

  return {
    // Data
    transactions,
    isLoading,
    error,

    // CRUD operations
    createTransaction: handleCreateTransaction,
    deleteTransaction: handleDeleteTransaction,

    // Mutation states
    isCreating: createTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
  };
};
