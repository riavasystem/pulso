"use client";

import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Coffee,
  LogIn,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            aria-label="Pulso+, inicio"
            className="flex items-center gap-2.5"
            href="/"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-bold text-white shadow-xs">
              P+
            </span>
            <span className="text-xl font-semibold tracking-tight">
              Pulso<span className="text-[#718a35]">+</span>
            </span>
          </Link>

          <nav
            aria-label="Navegación pública"
            className="hidden items-center gap-8 text-sm font-medium text-[var(--muted)] md:flex"
          >
            <a
              className="transition hover:text-[var(--ink)]"
              href="#caracteristicas"
            >
              ¿Cómo funciona?
            </a>
            <a
              className="transition hover:text-[var(--ink)]"
              href="#gastos-fijos"
            >
              Gastos fijos
            </a>
            <a
              className="transition hover:text-[var(--ink)]"
              href="#gastos-hormiga"
            >
              Gastos hormiga
            </a>
            <a
              className="transition hover:text-[var(--ink)]"
              href="#seguridad"
            >
              Seguridad
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {userEmail ? (
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--lime)] px-4 text-sm font-medium text-[var(--ink)] shadow-xs transition hover:brightness-95"
                href="/dashboard"
              >
                <Activity aria-hidden="true" className="size-4" />
                <span>Ir a mi Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  className="hidden h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--ink)] sm:inline-flex"
                  href="/login"
                >
                  <LogIn aria-hidden="true" className="size-4" />
                  <span>Iniciar sesión</span>
                </Link>
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--ink)] shadow-xs transition hover:bg-[var(--accent-hover)]"
                  href="/register"
                >
                  <span>Crear cuenta gratis</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 py-1 text-xs font-medium text-[var(--muted)] shadow-xs">
            <span className="flex size-2 rounded-full bg-[var(--lime)]" />
            <span>Finanzas personales simples, claras y privadas</span>
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-6xl sm:leading-[1.15]">
            El pulso exacto de tu dinero,{" "}
            <span className="relative inline-block text-[#56701f]">
              sin complicaciones.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Controla tus compromisos recurrentes, detecta fugas de dinero por gastos hormiga y mantén tu presupuesto mensual siempre al día con sincronización segura en la nube.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {userEmail ? (
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-6 text-base font-semibold text-[var(--ink)] shadow-md transition hover:bg-[var(--accent-hover)]"
                href="/dashboard"
              >
                <span>Acceder a mi Pulso</span>
                <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
            ) : (
              <>
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-6 text-base font-semibold text-[var(--ink)] shadow-md transition hover:bg-[var(--accent-hover)]"
                  href="/register"
                >
                  <span>Comenzar gratis</span>
                  <ArrowRight aria-hidden="true" className="size-5" />
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-5 text-base font-medium text-[var(--ink)] shadow-xs transition hover:bg-[var(--paper)]"
                  href="/login"
                >
                  <LogIn aria-hidden="true" className="size-4 text-[var(--muted)]" />
                  <span>Iniciar sesión</span>
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-transparent px-4 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--ink)]"
                  href="/dashboard"
                >
                  <Sparkles aria-hidden="true" className="size-4 text-[#718a35]" />
                  <span>Probar demo interactiva</span>
                </Link>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="size-4 text-[#718a35]" />
              100% en Pesos Chilenos (CLP)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="size-4 text-[#718a35]" />
              Sin hojas de cálculo enredadas
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 aria-hidden="true" className="size-4 text-[#718a35]" />
              Privacidad con cifrado en Supabase
            </span>
          </div>

          {/* Mini Dashboard Preview */}
          <div className="mt-14 rounded-xl border border-[var(--line)] bg-white p-4 shadow-xl sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between border-b border-[var(--line)] pb-4 text-left">
              <div>
                <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                  Resumen de tu mes
                </p>
                <p className="text-xl font-bold text-[var(--ink)]">
                  Octubre 2026
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f0db] px-3 py-1 text-xs font-medium text-[#485c1f]">
                <span className="size-2 rounded-full bg-[#718a35]" />
                Presupuesto saludable
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[var(--line)] bg-[#fdfdfb] p-4 text-left">
                <span className="flex size-8 items-center justify-center rounded-md bg-[var(--sky)] text-[var(--ink)]">
                  <Wallet aria-hidden="true" className="size-4" />
                </span>
                <p className="mt-3 text-xs text-[var(--muted)]">Ingresos del mes</p>
                <p className="text-xl font-bold tabular-nums">$1.450.000</p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[#fdfdfb] p-4 text-left">
                <span className="flex size-8 items-center justify-center rounded-md bg-[var(--lime)] text-[var(--ink)]">
                  <CalendarClock aria-hidden="true" className="size-4" />
                </span>
                <p className="mt-3 text-xs text-[var(--muted)]">Compromisos fijos</p>
                <p className="text-xl font-bold tabular-nums">$620.000</p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[#fdfdfb] p-4 text-left">
                <span className="flex size-8 items-center justify-center rounded-md bg-[#faeed8] text-[#935e23]">
                  <Coffee aria-hidden="true" className="size-4" />
                </span>
                <p className="mt-3 text-xs text-[var(--muted)]">Gastos hormiga</p>
                <p className="text-xl font-bold tabular-nums">$68.500</p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[#e8f0db] p-4 text-left">
                <span className="flex size-8 items-center justify-center rounded-md bg-[var(--ink)] text-white">
                  <TrendingUp aria-hidden="true" className="size-4" />
                </span>
                <p className="mt-3 text-xs text-[#485c1f]">Disponible real</p>
                <p className="text-xl font-bold text-[#304113] tabular-nums">$761.500</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className="border-t border-[var(--line)] bg-white py-16 sm:py-24"
        id="caracteristicas"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
              ¿De qué trata Pulso+?
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
              Diseñado para responder la pregunta más importante:{" "}
              <span className="text-[#56701f]">¿cuánto dinero tengo realmente hoy?</span>
            </p>
            <p className="mt-4 text-sm text-[var(--muted)] sm:text-base">
              La mayoría de las personas no tienen problemas con sus ingresos, sino con la falta de visibilidad en los compromisos fijos y los pequeños gastos del día a día.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div
              className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 transition hover:shadow-md"
              id="gastos-fijos"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-[var(--lime)] text-[var(--ink)]">
                <CalendarClock aria-hidden="true" className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--ink)]">
                Gastos Fijos Programados
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Arriendo, dividendo, cuentas de luz, agua, internet, colegios y suscripciones. Sabrás qué vence cada semana y podrás marcar cada cuenta como pagada en un solo clic.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-[#718a35]" />
                  Día de vencimiento visible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-[#718a35]" />
                  Frecuencia mensual, semanal o anual
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div
              className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 transition hover:shadow-md"
              id="gastos-hormiga"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#faeed8] text-[#935e23]">
                <Coffee aria-hidden="true" className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--ink)]">
                Control de Gastos Hormiga
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                El café de paso, el delivery no planeado, el snack del quiosco. Esos pequeños consumos que parecen inofensivos pero se comen tu capacidad de ahorro a fin de mes.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-[#718a35]" />
                  Botón de registro rápido
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-[#718a35]" />
                  Categorización automática
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div
              className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 transition hover:shadow-md"
              id="seguridad"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#e8f0db] text-[#3e5519]">
                <ShieldCheck aria-hidden="true" className="size-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--ink)]">
                Seguridad y Nube con Supabase
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Tus datos viajan cifrados y están protegidos por políticas Row Level Security (RLS) en PostgreSQL. Nadie más tiene acceso a tu información personal ni a tus montos.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-[#718a35]" />
                  Base de datos dedicada en la nube
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-[#718a35]" />
                  Sincronización multi-dispositivo
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative border-t border-[var(--line)] bg-[var(--paper)] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <span className="flex size-12 mx-auto items-center justify-center rounded-full bg-[var(--lime)] text-[var(--ink)] shadow-xs">
            <ReceiptText aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
            Comienza a tomar mejores decisiones financieras hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Crea tu cuenta en menos de un minuto y empieza a organizar tus ingresos, gastos fijos y presupuesto.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-7 text-base font-semibold text-[var(--ink)] shadow-md transition hover:bg-[var(--accent-hover)]"
              href="/register"
            >
              <span>Crear mi cuenta gratis</span>
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-5 text-base font-medium text-[var(--ink)] shadow-xs transition hover:bg-[var(--paper)]"
              href="/login"
            >
              <LogIn aria-hidden="true" className="size-4 text-[var(--muted)]" />
              <span>Ya tengo una cuenta</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] bg-white py-10 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-[var(--ink)] text-xs font-bold text-white">
              P+
            </span>
            <span className="font-semibold text-[var(--ink)]">
              Pulso<span className="text-[#718a35]">+</span>
            </span>
            <span className="text-[var(--line)]">|</span>
            <span>Finanzas personales simples</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link className="hover:text-[var(--ink)]" href="/login">
              Iniciar sesión
            </Link>
            <Link className="hover:text-[var(--ink)]" href="/register">
              Registrarse
            </Link>
            <Link className="hover:text-[var(--ink)]" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
