"use client";

import { IClassMember } from "@/types";
import { useState } from "react";
import {
  FiBookOpen,
  FiHeadphones,
  FiMic,
  FiUsers,
  FiBarChart2,
} from "react-icons/fi";
import { MembersList } from "./MembersList";
import { StudentProgressModal } from "./StudentProgressModal";
import { OverallProgressTable } from "./OverallProgressTable";

type Tab = "members" | "listening" | "quiz" | "speaking" | "lookup" | "overall";

function TabContent({
  activeTab,
  classId,
  setSelectedStudent,
}: {
  activeTab: Tab;
  classId: string;
  setSelectedStudent: (student: IClassMember | null) => void;
}) {
  switch (activeTab) {
    case "members":
      return (
        <MembersList classId={classId} onMemberClick={setSelectedStudent} />
      );
    case "overall":
      return <OverallProgressTable classId={classId} />;
    default:
      return (
        <p className="p-4 text-muted">
          Phần này đang được phát triển. Vui lòng quay lại sau.
        </p>
      );
  }
}

export function ClassDetail({ classId }: { classId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [selectedStudent, setSelectedStudent] = useState<IClassMember | null>(
    null
  );

  const tabs: { id: Tab; label: string; icon: React.ReactElement }[] = [
    { id: "members", label: "Thành viên", icon: <FiUsers /> },
    { id: "overall", label: "Bảng tổng hợp", icon: <FiBarChart2 /> },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex border-b border-border mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        <TabContent
          activeTab={activeTab}
          classId={classId}
          setSelectedStudent={setSelectedStudent}
        />
      </div>

      {selectedStudent && (
        <StudentProgressModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
