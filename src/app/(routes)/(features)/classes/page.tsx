"use client";

import { useAuth } from "@/lib/auth/context";
import { RequireAuth } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

const ClassesPage = () => {
  const { session } = useAuth();

  if (session?.user?.role === "teacher") {
    return redirect("/classes/teacher");
  } else if (session?.user?.role === "student") {
    return redirect("/classes/student");
  }

  return <></>;
};

export default ClassesPage;
