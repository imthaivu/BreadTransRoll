"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiMail,
  FiShield,
  FiFileText,
  FiPhone,
  FiFacebook,
} from "react-icons/fi";

export default function Footer() {
  const pathname = usePathname();

  // Nếu khác homepage thì không hiện footer
  if (pathname !== "/") {
    return null;
  }

  return (
    <footer
      aria-label="Footer dự án học tiếng Anh Breadtrans"
      className="bg-background border-t border-border p-6"
    >
      {/* Doraemon themed gradient line */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm md:text-base text-center sm:text-left">
        {/* Brand Section */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="flex justify-center">
            <Image
              src={"/assets/images/icon.ico"}
              alt="Breadtrans English Logo"
              width={96}
              height={96}
            />
          </div>

          <div className="text-lg font-bold text-primary text-center">
            BREADTRANS ENGLISH
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-4 flex flex-col items-center sm:items-start">
          <div className="font-semibold text-foreground">Về dự án</div>
          <div className="space-y-2 text-muted max-w-xs">
            <p>
              Người sáng lập & giảng dạy: <strong>Vũ Quốc Thái</strong>
            </p>
            <p>
              Dự án cá nhân nhằm chia sẻ phương pháp học tiếng Anh giao tiếp
              hiệu quả và vui vẻ.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4 flex flex-col items-center sm:items-start">
          <div className="font-semibold text-foreground flex items-center gap-2">
            <FiMail className="text-primary" />
            Liên hệ
          </div>
          <div className="space-y-2">
            <a
              href="mailto:breadtransenglish@gmail.com"
              className="flex items-center justify-center sm:justify-start gap-2 text-muted hover:text-primary transition-colors"
            >
              <FiMail />
              breadtransenglish@gmail.com
            </a>
            <a
              href="tel:+84377180010"
              className="flex items-center justify-center sm:justify-start gap-2 text-muted hover:text-primary transition-colors"
            >
              <FiPhone />
              0377180010
            </a>
           
          </div>
        </div>

        {/* Policy Section */}
        <div className="space-y-4 flex flex-col items-center sm:items-start">
          <div className="font-semibold text-foreground flex items-center gap-2">
            <FiShield className="text-primary" />
            Chính sách
          </div>
          <div className="space-y-2">
            <Link
              href="/privacy"
              className="flex items-center justify-center sm:justify-start gap-2 text-muted hover:text-primary transition-colors"
            >
              <FiShield />
              Chính sách bảo mật
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-center sm:justify-start gap-2 text-muted hover:text-primary transition-colors"
            >
              <FiFileText />
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
