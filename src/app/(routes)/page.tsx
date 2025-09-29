"use client";

import { useAuth } from "@/lib/auth/context";
import {
  AboutSection,
  BannerSwiper,
  ImportantNotice,
  MenuGrid,
  Timeline,
} from "@/modules/home/components";

export default function HomePage() {
  const { session, role } = useAuth();

  return (
    <div>
      {(!session?.user || role == "guest") && <BannerSwiper />}
      <MenuGrid />
      <Timeline />
      <AboutSection />
    </div>
  );
}
