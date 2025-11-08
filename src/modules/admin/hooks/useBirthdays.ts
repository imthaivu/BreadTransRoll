import { useQuery } from "@tanstack/react-query";
import { getUsersWithUpcomingBirthdays } from "../services/user.service";

// Query keys
export const birthdayKeys = {
  all: ["birthdays"] as const,
  upcoming: (days: number) => [...birthdayKeys.all, "upcoming", { days }] as const,
};

// Hook to get users with upcoming birthdays
export const useUpcomingBirthdays = (daysAhead: number = 10) => {
  return useQuery({
    queryKey: birthdayKeys.upcoming(daysAhead),
    queryFn: () => getUsersWithUpcomingBirthdays(daysAhead),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

