import { useMutation } from "@tanstack/react-query";
import { updateStudentStreak } from "./services";
import toast from "react-hot-toast";

export const useUpdateStudentStreak = () => {
  return useMutation({
    mutationFn: updateStudentStreak,
    onError: (error) => {
      console.error("Failed to update streak:", error);
      // We don't show a toast here to avoid bothering the user
      // with a non-critical background task failure.
    },
  });
};
