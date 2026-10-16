import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/features/auth/auth-card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Pulso+",
  description: "Recupera el acceso a tu cuenta de Pulso+.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      footer={
        <p>
          ¿Te acordaste de tu contraseña?{" "}
          <Link
            className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
            href="/login"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      }
      subtitle="Ingresa tu correo y te enviaremos un enlace de recuperación"
      title="Recuperar contraseña"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

