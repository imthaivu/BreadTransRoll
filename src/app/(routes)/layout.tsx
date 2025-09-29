import { ReactNode } from "react";

interface FeatureLayoutProps {
  children: ReactNode;
}

export default function FeatureLayout({ children }: FeatureLayoutProps) {
  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
      {children}
    </div>
  );
}
