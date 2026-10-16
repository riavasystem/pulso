"use client";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { registerSchema } from "./model";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const supabaseReady = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const parsed = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? "Datos inválidos.";
      setStatus({ type: "error", message: issue });
      return;
    }

    if (!supabaseReady) {
      setStatus({
        type: "info",
        message:
          "Formulario validado con éxito. Para crear usuarios en la nube, conecta las variables de Supabase en tu .env.local.",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus({
          type: "error",
          message: error.message,
        });
        return;
      }

      if (data.session) {
        setStatus({
          type: "success",
          message: "¡Cuenta creada exitosamente! Redirigiendo...",
        });
        router.push("/dashboard");
        router.refresh();
      } else {
        setStatus({
          type: "success",
          message:
            "¡Cuenta creada con éxito! Revisa tu bandeja de entrada para confirmar tu correo y comenzar.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Ocurrió un error al registrar la cuenta.",
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
            <User aria-hidden="true" className="size-4 text-[var(--muted)]" />
            Nombre
          </span>
          <input
            autoComplete="given-name"
            autoFocus
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--ink)]"
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Juan"
            required
            type="text"
            value={firstName}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
            <User aria-hidden="true" className="size-4 text-[var(--muted)]" />
            Apellido
          </span>
          <input
            autoComplete="family-name"
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--ink)]"
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Pérez"
            required
            type="text"
            value={lastName}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
          <Mail aria-hidden="true" className="size-4 text-[var(--muted)]" />
          Correo electrónico
        </span>
        <input
          autoComplete="email"
          className="h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--ink)]"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.cl"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
          <Lock aria-hidden="true" className="size-4 text-[var(--muted)]" />
          Contraseña
        </span>
        <div className="relative">
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[var(--ink)]"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
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

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
          <Lock aria-hidden="true" className="size-4 text-[var(--muted)]" />
          Confirmar contraseña
        </span>
        <div className="relative">
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-[var(--line)] bg-white pr-10 pl-3 text-sm outline-none transition focus:border-[var(--ink)]"
            minLength={6}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repite tu contraseña"
            required
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
          />
          <button
            aria-label={
              showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"
            }
            className="absolute top-0 right-0 flex h-11 w-10 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            type="button"
          >
            {showConfirmPassword ? (
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
        {loading ? "Creando cuenta..." : "Crear mi cuenta"}
      </button>
    </form>
  );
}

