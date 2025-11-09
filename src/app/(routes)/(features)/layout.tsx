"use client";

import BackButton from "@/components/ui/BackButton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useScrollToTop } from "@/hooks";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface FeatureLayoutProps {
  children: ReactNode;
}

export default function FeatureLayout({ children }: FeatureLayoutProps) {
  useScrollToTop();
  const pathname = usePathname();

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = () => {
    const segments = pathname.split("/").filter(Boolean);
    const items = [];

    items.push({ label: "Trang chủ", href: "/" });

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Map segment to readable label
      let label = segment;
      if (segment === "classes") label = "Lớp học";
      else if (segment === "dashboard") label = "Dashboard";
      else if (segment === "profile") label = "Hồ sơ";
      else if (segment === "flashcard") label = "Flashcard / Quiz";
      else if (segment === "leaderboard") label = "Bảng xếp hạng";
      else if (segment === "lessons1000") label = "1000 Bài luyện";
      else if (segment === "shopping") label = "Mua sắm";
      else if (segment === "streamline") label = "Streamline English";
      else if (segment === "video") label = "Video";
      else if (segment === "student") label = "Học sinh";
      else if (segment === "teacher") label = "Giáo viên";
      else if (segment === "admin") label = "Quản trị";
      else if (segment === "lessons") label = "Bài học";
      else if (segment === "scripts") label = "Scripts";
      else if (segment === "new") label = "Tạo mới";
      else if (segment === "upload") label = "Nộp bài nói";
      else if (segment === "analytics") label = "Phân tích";
      else if (segment === "users") label = "Người dùng";
      else if (segment === "grammar") label = "Ngữ pháp";
      else if (segment === "speaking-upload") label = "Nộp bài nói";
      else if (segment === "spin-dorayaki") label = "Vòng quay bánh mì";
      else {
        // For dynamic segments (like classId, lessonId), try to make them more readable
        if (segment.length > 10) {
          label = segment.substring(0, 8) + "...";
        }
      }

      // Don't add href for the last segment (current page)
      const href = index === segments.length - 1 ? undefined : currentPath;
      items.push({ label, href });
    });

    return items;
  };

  return (
    <div className="bg-gradient-to-br bg-white rounded-xl">
      {/* Feature Header */}
      <div className="bg-white/80 border-b border-gray-200 rounded-t-xl">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <BackButton className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group">
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium hidden md:inline-block">
                  Quay lại
                </span>
              </BackButton>

              <div className="h-6 w-px bg-gray-300 hidden md:block"></div>

              <div className="hidden md:block">
                <Breadcrumb items={getBreadcrumbItems()} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Content */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2 min-h-[calc(100vh-122px)]">
        {children}
      </div>
    </div>
  );
}
