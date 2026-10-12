# Pulso+

Aplicación web de finanzas personales para registrar gastos manualmente y entender los hábitos de gasto.

## Dashboard disponible

- Resumen mensual de ingresos, gastos, disponible y porcentaje utilizado.
- Gastos por categoría, tipo y día de la semana; los gráficos parten vacíos y usan solo movimientos registrados.
- Registro de gastos variables y filtro por tipo.
- Registro de gastos fijos con sugerencias editables, nombre propio, categoría, monto, vencimiento y frecuencia.
- Registro de pago recurrente con protección contra duplicados según su frecuencia.
- Mi Perfil con edición de datos personales (nombre, apellido, correo) y gestión de contraseña.
- Datos guardados en el almacenamiento local de este navegador.

Para conocer el detalle del stack y el mapa de componentes, revisa [avances.md](avances.md).

**Importante:** esta etapa todavía no tiene registro/login ni persistencia por cuenta. Los datos locales no se sincronizan entre dispositivos ni deben considerarse una cuenta financiera privada. Supabase, RLS y autenticación deben quedar implementados antes de incorporar clientes reales.

## Stack

- Next.js App Router, React y TypeScript estricto
- Tailwind CSS 4
- Supabase Auth y PostgreSQL mediante `@supabase/ssr`
- Zod para validaciones
- Vitest para pruebas unitarias
- GitHub Actions para lint, tipos, tests y build

## Requisitos

- Node.js 22 (mínimo soportado: 20.9)
- npm 10 o superior
- Un proyecto Supabase para habilitar autenticación y persistencia

## Instalación local

```bash
nvm use
npm ci
cp .env.example .env.local
```

Completa las variables públicas de Supabase en `.env.local`. El proyecto puede compilarse sin credenciales mientras no se invoquen los clientes de Supabase.

```bash
npm run dev
```

Abre <http://localhost:3000>.

## Variables de entorno

| Variable                        | Uso                                                          |
| ------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto Supabase                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon/publishable, protegida por RLS            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Solo servidor; no se utiliza en el cliente ni debe exponerse |

No subas `.env.local` ni claves reales al repositorio. La plantilla `.env.example` no contiene secretos.

## Comandos

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

## Supabase

1. Crea un proyecto en Supabase.
2. Copia la URL y la clave anon/publishable a `.env.local`.
3. Configura las URLs de callback y recuperación cuando se implemente autenticación.
4. Las tablas, políticas RLS y migraciones se incorporarán en la etapa de datos. El dashboard actual usa únicamente almacenamiento local del navegador.

## Arquitectura y seguridad

Revisa [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md) y [SECURITY.md](SECURITY.md). La app se organiza como monolito modular: UI en `src/app` y `src/components`, capacidades en `src/features`, e integraciones compartidas en `src/lib`.

## CI/CD y despliegue

GitHub Actions valida cada Pull Request y pushes a `main`/`develop`. Para desplegar, importa el repositorio en Vercel, configura las variables de entorno por ambiente y habilita previews para Pull Requests. No se configura un backend separado ni se requieren servicios de pago para esta etapa.

## Próximas etapas

Login/registro, persistencia en Supabase, esquema de base de datos, políticas RLS y sincronización por usuario siguen pendientes. El dashboard no incluye datos demo precargados.
