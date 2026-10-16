import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <Link
          aria-label="Pulso+, volver al inicio"
          className="inline-flex items-center gap-2"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-bold text-white">
            P+
          </span>
          <span className="text-xl font-semibold">
            Pulso<span className="text-[#718a35]">+</span>
          </span>
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>

      {children}

      {footer ? (
        <div className="mt-6 border-t border-[var(--line)] pt-4 text-center text-sm text-[var(--muted)]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

