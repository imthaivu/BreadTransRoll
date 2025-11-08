"use client";

import { IClass } from "@/types";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { FiUsers } from "react-icons/fi";

export function StudentClassCard({
  classItem,
  onViewDetail,
}: {
  classItem: IClass;
  onViewDetail?: () => void;
}) {
  const zaloLink = classItem?.links?.zalo;
  const meetLink = classItem?.links?.meet;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Tên lớp */}
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {classItem.name}
      </h3>

      {/* Giáo viên */}
      <div className="flex items-center gap-3 mb-4">
        {classItem?.teacher?.avatarUrl ? (
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={classItem.teacher.avatarUrl}
              alt={classItem?.teacher?.name || "Giáo viên"}
              fill
              className="rounded-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {(classItem?.teacher?.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {classItem?.teacher?.name || "Chưa có giáo viên"}
          </p>
          {classItem?.teacher?.phone && (
            <p className="text-xs text-gray-500">
              📞 {classItem.teacher.phone}
            </p>
          )}
        </div>
      </div>

      {/* Links gộp lại */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {zaloLink && (
          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 font-medium rounded-lg hover:bg-blue-100 transition-colors"
            title="Mở nhóm Zalo"
          >
            <Image
              src={"/assets/images/zalo.png"}
              alt="Zalo"
              width={16}
              height={16}
              quality={100}
            />
            <span>Zalo</span>
          </a>
        )}
        {meetLink && (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 bg-yellow-50 font-medium rounded-lg hover:bg-yellow-100 transition-colors"
            title="Mở link Google Meet"
          >
            <Image
              src={"/assets/images/meet.png"}
              alt="Google Meet"
              width={16}
              height={16}
              quality={100}
            />
            <span>Meet</span>
          </a>
        )}
      </div>

      {/* Nút xem thành viên */}
      <Button
        variant="outline"
        size="sm"
        onClick={onViewDetail}
        className="w-full flex items-center justify-center gap-2"
      >
        <FiUsers className="w-4 h-4" />
        Xem thành viên
      </Button>
    </div>
  );
}
