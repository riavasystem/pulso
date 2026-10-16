"use client";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { loginSchema } from "./model";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const supabaseReady = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      setStatus({ type: "error", message: issue });
      return;
    }

    if (!supabaseReady) {
      setStatus({
        type: "info",
        message:
          "Formulario validado con éxito. Para autenticar en vivo, configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu .env.local o Vercel.",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus({
          type: "error",
          message:
            error.message === "Invalid login credentials"
              ? "Credenciales incorrectas. Revisa tu correo y contraseña."
              : error.message,
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Inicio de sesión correcto. Redirigiendo...",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Ocurrió un error al iniciar sesión.",
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

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
            <Lock aria-hidden="true" className="size-4 text-[var(--muted)]" />
            Contraseña
          </span>
          <Link
            className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
            href="/forgot-password"
          >
            ¿Olvidaste tu clave?
          </Link>
        </div>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[var(--ink)]"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute top-0 right-0 flex h-11 w-10 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
            onClick={() => setShowPassword((prev) => !prev)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
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
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

