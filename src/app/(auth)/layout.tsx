import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] p-4 sm:p-6 lg:p-8">
      {children}
    </div>
  );
}

