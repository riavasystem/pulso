import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/auth-card";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Pulso+",
  description: "Crea tu cuenta de finanzas personales en Pulso+.",
};

export default function RegisterPage() {
  return (
    <AuthCard
      footer={
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link
            className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
            href="/login"
          >
            Inicia sesión
          </Link>
        </p>
      }
      subtitle="Comienza a controlar tus gastos y finanzas personales"
      title="Crear cuenta"
    >
      <RegisterForm />
    </AuthCard>
  );
}
