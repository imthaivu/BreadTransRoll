"use client";

import { Button } from "@/components/ui/Button";
import { FiMenu } from "react-icons/fi";

interface AdminTopBarProps {
  setSidebarOpen: (open: boolean) => void;
  className?: string;
}

export default function AdminTopBar({
  setSidebarOpen,
  className = "",
}: AdminTopBarProps) {
  return (
    <div className={`lg:hidden fixed top-[60px] ${className}`}>
      <div className="flex items-center justify-between h-16">
        <Button variant="primary" onClick={() => setSidebarOpen(true)}>
          <FiMenu className="w-5 h-5" />
          <span className="ml-2">Menu</span>
        </Button>
      </div>
    </div>
  );
}
