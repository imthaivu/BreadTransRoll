import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../services/dashboard.service";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (range: "week" | "month") =>
    [...dashboardKeys.all, "stats", { range }] as const,
};

// Hook to get dashboard stats
export const useDashboardStats = (range: "week" | "month" = "week") => {
  return useQuery({
    queryKey: dashboardKeys.stats(range),
    queryFn: () => getDashboardStats(range),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
