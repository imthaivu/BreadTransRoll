"use client";

import { Button } from "@/components/ui/Button";
import { IClass } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiEdit } from "react-icons/fi";

export function ClassCard({
  classItem,
  onUpdateClick,
}: {
  classItem: IClass;
  onUpdateClick?: () => void;
}) {
  const zaloLink = classItem?.links?.zalo;
  const meetLink = classItem?.links?.meet;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="p-5 flex-grow">
        <h3 className="text-2xl font-bold text-foreground mb-2">
          <Link
            href={`/classes/${classItem.id}`}
            className="hover:text-primary transition-colors"
          >
            {classItem.name}
          </Link>
        </h3>
        <p className="text-sm">
          <b>Giáo viên:</b> {classItem?.teacher?.name || "Không rõ"}
        </p>
        <p className="text-sm">
          <b>SĐT giáo viên:</b> {classItem?.teacher?.phone || "Không rõ"}
        </p>
      </div>
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Liên kết:</span>

            {zaloLink && (
              <a
                href={zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-100 font-semibold rounded-xl hover:bg-blue-200 transition-colors"
                title="Mở nhóm Zalo"
              >
                <Image
                  src={"/assets/images/zalo.png"}
                  alt="Zalo"
                  width={24}
                  height={24}
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
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-black bg-yellow-200 font-semibold rounded-xl hover:bg-yellow-300 transition-colors"
                title="Mở link Google Meet"
              >
                <Image
                  src={"/assets/images/meet.png"}
                  alt="Google Meet"
                  width={24}
                  height={24}
                  quality={100}
                />
                <span>Meet</span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-end">
            {onUpdateClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUpdateClick}
                className="flex items-center gap-1"
              >
                <FiEdit className="w-3 h-3" />
                Cập nhật
              </Button>
            )}
            <Link href={`/classes/${classItem.id}`} passHref>
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1"
              >
                Xem chi tiết
                <FiArrowRight className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
