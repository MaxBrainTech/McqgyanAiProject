import type { ReactNode } from "react";
import FloatingIcons from "./FloatingIcons";

interface AuthBackgroundProps {
  children: ReactNode;
}

export default function AuthBackground({
  children,
}: AuthBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      {/* Floating Background */}
      <FloatingIcons />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}