import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Pulso+",
  description: "Accede a tu cuenta de finanzas personales en Pulso+.",
};

export default function LoginPage() {
  return (
    <AuthCard
      footer={
        <p>
          ¿Aún no tienes una cuenta?{" "}
          <Link
            className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
            href="/register"
          >
            Regístrate gratis
          </Link>
        </p>
      }
      subtitle="Ingresa a tu cuenta de finanzas personales"
      title="Iniciar sesión"
    >
      <LoginForm />
    </AuthCard>
  );
}

