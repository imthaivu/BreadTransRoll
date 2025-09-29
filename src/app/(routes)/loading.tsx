import { DoraemonLoading } from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <DoraemonLoading text="Đang tải tính năng..." />
    </div>
  );
}
