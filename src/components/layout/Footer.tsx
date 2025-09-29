"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBookOpen,
  FiStar,
  FiVideo,
  FiLayers,
  FiShoppingBag,
  FiMail,
  FiShield,
  FiFileText,
} from "react-icons/fi";

export default function Footer() {
  const pathname = usePathname();

  // Nếu khác homepage thì không hiện
  if (pathname !== "/") {
    return null;
  }

  return (
    <footer className="bg-background border-t border-border">
      {/* Doraemon themed gradient line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-accent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm md:text-base mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                <Image
                  className="rounded-full"
                  src={"/assets/images/icon.ico"}
                  alt="App Logo"
                  width={32}
                  height={32}
                />
              </div>
              <div className="text-lg font-bold text-primary">
                BREAD TRANSLATION
              </div>
            </div>
            <p className="text-muted leading-relaxed">
              Học tiếng Anh giao tiếp mỗi ngày cùng Doraemon. Phương pháp học
              thú vị và hiệu quả.
            </p>
            <div className="flex gap-2">
              <div className="text-lg">📚</div>
              <div className="text-lg">🎵</div>
              <div className="text-lg">🎯</div>
              <div className="text-lg">🏆</div>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <FiStar className="text-primary" />
              Tính năng chính
            </div>
            <div className="space-y-2">
              <Link
                href="/flashcard"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiBookOpen className="text-sm md:text-base" />
                Flashcard
              </Link>
              <Link
                href="/streamline"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiStar className="text-sm md:text-base" />
                Streamline
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiStar className="text-sm md:text-base" />
                Bảng xếp hạng
              </Link>
              <Link
                href="/video"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiVideo className="text-sm md:text-base" />
                Video
              </Link>
            </div>
          </div>

          {/* More Features Section */}
          <div className="space-y-4">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <FiLayers className="text-primary" />
              Tính năng khác
            </div>
            <div className="space-y-2">
              <Link
                href="/lessons1000"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiLayers className="text-sm md:text-base" />
                1000 Bài luyện
              </Link>
              <Link
                href="/shopping"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiShoppingBag className="text-sm md:text-base" />
                Shopping
              </Link>
              <Link
                href="/classes"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiBookOpen className="text-sm md:text-base" />
                Lớp học
              </Link>
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <FiMail className="text-primary" />
              Hỗ trợ
            </div>
            <div className="space-y-2">
              <a
                href="mailto:support@dse.com"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiMail className="text-sm md:text-base" />
                Liên hệ
              </a>
              <a
                href="/privacy"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiShield className="text-sm md:text-base" />
                Chính sách
              </a>
              <a
                href="/terms"
                className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
              >
                <FiFileText className="text-sm md:text-base" />
                Điều khoản
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-muted text-sm md:text-base">
              © {new Date().getFullYear()} BREADTRANS rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm md:text-base text-muted">
              <span>Made with ❤️ by Doraemon</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-secondary rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-accent rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
