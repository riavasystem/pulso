"use client";

import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { forgotPasswordSchema } from "./model";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const supabaseReady = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? "Correo inválido.";
      setStatus({ type: "error", message: issue });
      return;
    }

    if (!supabaseReady) {
      setStatus({
        type: "info",
        message:
          "Formulario validado con éxito. Para enviar correos de recuperación, configura tus credenciales de Supabase.",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback`,
      });

      if (error) {
        setStatus({
          type: "error",
          message: error.message,
        });
        return;
      }

      setStatus({
        type: "success",
        message:
          "Te hemos enviado un correo con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Ocurrió un error al enviar el correo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!supabaseReady ? (
        <div
          className="flex items-start gap-2 rounded-md border border-[#e4d3a0] bg-[#fffbe6] p-3 text-xs text-[#7c631a]"
          role="status"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Modo sin conexión remota:</strong> Las variables de Supabase
            aún no están configuradas. Puedes probar la validación del
            formulario localmente.
          </span>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
          <Mail aria-hidden="true" className="size-4 text-[var(--muted)]" />
          Correo electrónico
        </span>
        <input
          autoComplete="email"
          autoFocus
          className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--ink)]"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.cl"
          required
          type="email"
          value={email}
        />
      </label>

      {status ? (
        <div
          className={`flex items-start gap-2 rounded-md p-3 text-xs ${
            status.type === "success"
              ? "bg-[#e8f0db] text-[#3e5519]"
              : status.type === "info"
                ? "bg-[#edf5fb] text-[#24587a]"
                : "bg-[#fde8e4] text-[#ad3e35]"
          }`}
          role="alert"
        >
          {status.type === "success" ? (
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      ) : null}

      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}

