# Avances del Proyecto Pulso+

Documento de referencia rápida y bitácora técnica de **Pulso+**. Su objetivo es brindar una visión inmediata y exhaustiva del stack tecnológico, la arquitectura por carpetas/archivos, las instrucciones para levantar el proyecto localmente y el registro histórico de avances, evitando exploraciones redundantes del código fuente.

---

## 1. Guía Rápida: Cómo Subir el Localhost y Navegar las Páginas

### 1.1. Requisitos Previos
* **Node.js**: Versión 20.9.0 o superior (recomendado Node 22).
* **Gestor de paquetes**: npm 10 o superior.

### 1.2. Comandos para Ejecutar el Proyecto en Localhost

```bash
# 1. Instalar dependencias del proyecto (si es la primera vez)
npm install

# 2. Iniciar el servidor de desarrollo en localhost
npm run dev
```

Una vez ejecutado `npm run dev`, la aplicación estará corriendo en:
* **URL principal**: `http://localhost:3000` o `http://127.0.0.1:3000`

### 1.3. Comandos de Calidad y Producción

```bash
# Ejecutar todas las pruebas unitarias (Vitest)
npm test

# Verificación de tipos TypeScript estricto
npm run typecheck

# Verificación de reglas de estilo y linter (ESLint)
npm run lint

# Compilar la aplicación para producción
npm run build

# Levantar el servidor con la versión de producción ya compilada
npm run start
```

---

## 2. Mapa de Páginas y Vistas Disponibles en Localhost

La arquitectura actual utiliza Next.js con el patrón de monolito modular. En la ruta principal (`http://localhost:3000/`) se interactúa fluidamente con las 4 secciones principales a través del menú de navegación (disponible en la barra lateral izquierda en escritorio y en la barra inferior en dispositivos móviles):

| Sección / Vista | Identificador de Vista | Icono | Descripción y Capacidades |
| :--- | :--- | :--- | :--- |
| **Inicio** | `home` | `Activity` | **Dashboard financiero central**: Resumen mensual (Ingresos, Gastos totales, Disponible, % utilizado), gráfico circular fijos vs variables, barras de gastos por categoría con ordenación, ritmo de la semana (Lun–Dom), ritmo mensual (días 1–31) y alertas inteligentes (*Insights*). |
| **Gastos Fijos** | `fixed` | `CalendarClock` | **Compromisos recurrentes**: Listado de cuentas (arriendo, agua, luz, internet, etc.), frecuencia (mensual, semanal, anual), monto, día de vencimiento, botón de un clic para registrar o revertir pago del período actual, y creador/editor con sugerencias inteligentes. |
| **Historial de Gastos** | `expenses` | `ReceiptText` | **Registro detallado de movimientos**: Listado cronológico paginado (20 por página), filtros por tipo (Todos, Fijos, Variables), filtros por mes completo o selector por rango de fechas específicas, y botón de edición por cada gasto. |
| **Mi Perfil** | `profile` | `User` | **Administración de cuenta de usuario**: Avatar con iniciales calculadas automáticamente, tarjeta de resumen con estado "Cuenta activa" y moneda (CLP), **formulario de edición de datos personales** (Nombre, Apellido, Email) con validación Zod, **formulario de seguridad** (Contraseña actual, Nueva contraseña de min. 6 caracteres y confirmación), y panel de acceso/sincronización con enlaces a login y registro. |
| **Iniciar Sesión** | Ruta `/login` | `LogIn` | **Pantalla de autenticación**: Formulario para iniciar sesión con correo y contraseña, validación Zod en tiempo real, integración con Supabase Auth y mensaje de degradación elegante en modo local/offline si las variables de entorno aún no están configuradas. |
| **Registro** | Ruta `/register` | `UserPlus` | **Pantalla de creación de cuenta**: Registro de nombre, apellido, correo electrónico y contraseña con confirmación coincidente. |
| **Recuperación** | Ruta `/forgot-password` | `KeyRound` | **Pantalla de restablecimiento**: Solicitud de correo electrónico para envío de enlace de recuperación de contraseña con token PKCE. |

---

## 3. Stack Tecnológico Detallado

| Capa / Dominio | Tecnología | Versión | Rol / Responsabilidad en Pulso+ |
| :--- | :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) | `^16.0.0` | Arquitectura de páginas (`src/app`), Server Components y Route Handlers (despliegue en Vercel). |
| **Biblioteca UI** | React | `^19.2.0` | Componentes interactivos de cliente y sincronización reactiva de estado (`useSyncExternalStore`). |
| **Estilos & Diseño** | Tailwind CSS (PostCSS) | `^4.1.13` | Sistema de diseño basado en variables semánticas (`--paper`, `--ink`, `--lime`, `--accent`, etc.) en `globals.css`. |
| **Iconografía** | Lucide React | `^1.52.0` | Iconos de navegación, categorías financieras y componentes de acción. |
| **Modelado & Validación** | Zod | `^4.1.0` | Esquemas de validación estricta de gastos, presupuestos, perfil de usuario (`userProfileSchema`), cambio de contraseña (`passwordChangeSchema`), login, registro y recuperación. |
| **Tipado Estático** | TypeScript | `^5.9.2` | Verificación estricta sin `any`, interfaces inferidas automáticamente desde esquemas Zod. |
| **Persistencia Actual** | Browser LocalStorage | Nativo | Clave `pulso-plus:finance:v1`. Sincronización reactiva multi-pestaña mediante `useSyncExternalStore` y eventos de almacenamiento del navegador. |
| **BaaS / Backend** | Supabase (SSR & JS) | `@supabase/ssr ^0.7.0`, `@supabase/supabase-js ^2.57.0` | Clientes configurados en `src/lib/supabase/` tolerantes a fallos (`isSupabaseConfigured`) para soporte híbrido online/offline y autenticación Supabase Auth. |
| **Testing** | Vitest | `^3.2.7` | Pruebas unitarias ultrarrápidas de cálculo financiero, agregaciones y esquemas de validación (28 tests pasando). |
| **Linter & Formatter** | ESLint & Prettier | `eslint ^9.35.0`, `prettier ^3.6.2` | Reglas estrictas de calidad de código, formato y orden de clases de Tailwind. |

---

## 4. Estructura y Responsabilidad de Carpetas y Archivos

```text
pulso+/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Validación continua: lint, typecheck, tests y build en PRs
│       └── deploy.yml                      # Despliegue automatizado a Vercel (Preview en develop, Production en main)
├── src/
│   ├── app/                                # Capa de ruteo de Next.js
│   │   ├── (auth)/                         # Grupo de rutas de autenticación
│   │   │   ├── layout.tsx                  # Layout centrado con fondo temático Pulso+
│   │   │   ├── login/page.tsx              # Ruta /login
│   │   │   ├── register/page.tsx           # Ruta /register
│   │   │   └── forgot-password/page.tsx    # Ruta /forgot-password
│   │   ├── auth/
│   │   │   └── callback/route.ts           # Route Handler PKCE para intercambio de código de autenticación
│   │   ├── layout.tsx                      # Layout raíz: fuentes, metadatos y contenedor global
│   │   ├── page.tsx                        # Punto de entrada de la aplicación (renderiza Dashboard)
│   │   └── globals.css                     # Variables CSS de tema (paleta viva/contrastante) e import de Tailwind
│   │
│   ├── features/                           # Módulos por dominio de negocio
│   │   ├── auth/                           # Módulo de Autenticación
│   │   │   ├── auth-card.tsx               # Contenedor visual con cabecera de marca y enlaces
│   │   │   ├── login-form.tsx              # Formulario interactivo de inicio de sesión
│   │   │   ├── register-form.tsx           # Formulario interactivo de registro
│   │   │   ├── forgot-password-form.tsx    # Formulario interactivo de recuperación de clave
│   │   │   ├── model.ts                    # Esquemas Zod (login, register, forgotPassword) y tipos
│   │   │   └── model.test.ts               # Tests unitarios para validación de formularios auth (9 tests)
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.tsx               # Componente principal de UI: barra lateral, navegación móvil,
│   │       │                               # vistas (Inicio, Gastos Fijos, Historial, Mi Perfil),
│   │       │                               # modales (gasto, fijo, presupuesto) y componentes de perfil
│   │       │                               # (PersonalProfileForm y PasswordSecurityForm).
│   │       ├── model.ts                    # Lógica de dominio: esquemas Zod (gastos, gastos fijos,
│   │       │                               # perfil de usuario, cambio de contraseña, finanzas), categorías fijas
│   │       │                               # y funciones de cálculo mensual, semanal y diario.
│   │       └── model.test.ts               # Tests unitarios de modelos, agregaciones y validación de perfil (14 tests).
│   │
│   └── lib/                                # Utilidades compartidas y librerías auxiliares
│       ├── utils/
│       │   ├── currency.ts                 # Formato chileno CLP (Intl.NumberFormat) y parser de inputs monetarios.
│       │   └── currency.test.ts            # Tests unitarios de cálculo y formato monetario (5 tests).
│       │
│       └── supabase/
│           ├── client.ts                   # Fábrica de cliente Supabase para el navegador segura y tolerante (createBrowserClient / getBrowserClient).
│           └── server.ts                   # Fábrica de cliente Supabase para Server Components y Route Handlers (createServerClient).
│
├── .env.example                            # Variables requeridas de Supabase (URL, ANON_KEY, SERVICE_ROLE_KEY).
├── planificacion.md                        # Documento maestro con las especificaciones y roadmap del MVP.
├── ARCHITECTURE.md                         # Principios de diseño modular, monolito Next.js y límites de capas.
├── DATABASE.md                             # Especificación del modelo relacional PostgreSQL y políticas RLS.
└── avances.md                              # Este archivo: registro de stack, comandos y bitácora técnica de avances.
```

---

## 5. Estado de Avance del Proyecto

### 5.1. Qué se ha completado

1. **Eliminación total de la sección "Análisis":**
   - Se removió completamente del menú de navegación (escritorio y móvil).
   - Se eliminó el botón "Ver análisis" en la vista de Inicio.
   - Se retiró el bloque redundante de gráficos secundarios de análisis (las métricas clave ya están integradas en el Inicio).
   - El código fuente en `src/` quedó limpio de referencias no utilizadas a `analytics`.

2. **Creación del Módulo "Mi Perfil" (`profile`):**
   - **Modelos y Validación Zod (`model.ts`):**
     - Esquema de perfil `userProfileSchema` con validación de nombre, apellido, email y contraseña.
     - Esquema de cambio de contraseña `passwordChangeSchema` (mínimo 6 caracteres, validación cruzada de coincidencia).
     - Objeto por defecto `defaultUserProfile` y soporte retrocompatible en `financeDataSchema` con `.default()`.
   - **Interfaz Gráfica (`dashboard.tsx`):**
     - Menú principal actualizado con acceso directo a "Mi Perfil" e icono `User`.
     - Tarjeta de identidad con iniciales de avatar dinámicas, badge de estado y moneda CLP.
     - Formulario `PersonalProfileForm` para editar Nombre, Apellido y Email con feedback visual de guardado.
     - Formulario `PasswordSecurityForm` para gestionar la contraseña con confirmación y alertas de validación.
     - Panel de "Acceso y cuentas" para vincular con login y registro.
   - **Pruebas Automatizadas (`model.test.ts`):**
     - Pruebas unitarias para validación de campos de perfil, lógica de coincidencia de contraseñas y retrocompatibilidad de datos antiguos en `localStorage`.

3. **Bitácora y Documentación Técnica (`avances.md`):**
   - Stack tecnológico detallado con versiones y responsabilidades.
   - Mapa de estructura de archivos actualizado.
   - Guía de comandos para levantar localhost y descripción de cada pantalla.

4. **Automatización de Despliegues CI/CD con GitHub Actions y Vercel (`deploy.yml`):**
   - Creación del workflow de despliegue continuo en `.github/workflows/deploy.yml`.
   - Vinculación exitosa con la organización `clientes-riava` y proyecto `pulso` en Vercel.
   - Secretos de repositorio configurados en GitHub (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
   - Pipeline verificado en producción: validación de calidad previa (lint, tipos, tests) y despliegue automático exitoso.

5. **Pantallas y Rutas de Autenticación (`/login`, `/register`, `/forgot-password`):**
   - **Rutas dedicadas**: Implementación en App Router de Next.js (`src/app/(auth)/`).
   - **Componentes interactivos**: `LoginForm`, `RegisterForm`, `ForgotPasswordForm` y `AuthCard` con estética fiel a Pulso+.
   - **Validación robusta con Zod (`src/features/auth/model.ts`)**: Esquemas para email, longitud de clave y confirmación idéntica.
   - **Manejo resiliente de Supabase**: `isSupabaseConfigured()` previene errores cuando no se han inyectado las claves de entorno todavía, informando con mensajes amigables al usuario.
   - **Route Handler de Callback (`src/app/auth/callback/route.ts`)**: Intercambio de tokens PKCE para login por enlace mágico o confirmación de correo.
   - **Suite de pruebas**: 9 nuevos tests unitarios creados en `src/features/auth/model.test.ts`, alcanzando **28 pruebas en total**, todas aprobadas.

---

### 5.2. Qué queda por realizar (Próximos Pasos del Roadmap)

De acuerdo con [`planificacion.md`](planificacion.md) y [`DATABASE.md`](DATABASE.md), las siguientes fases de desarrollo corresponden a:

1. **Conexión de Credenciales de Supabase:**
   - Crear el proyecto en [supabase.com](https://supabase.com).
   - Obtener `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Inyectarlas en `.env.local` y como Environment Variables en el proyecto de Vercel.

2. **Fase de Persistencia en Base de Datos (Supabase PostgreSQL):**
   - Ejecutar las migraciones SQL para las tablas `profiles`, `categories`, `expenses` y `fixed_expenses`.
   - Implementar políticas **Row Level Security (RLS)** para garantizar que cada usuario acceda exclusivamente a su información.
   - Sincronizar datos entre la base de datos de Supabase y el estado local.

3. **Fase de Categorías y Métodos de Pago Personalizados:**
   - Permitir al usuario crear, editar y eliminar categorías de gasto privadas adicionales a las del sistema.
   - Soporte para métodos de pago opcionales (débito, crédito, efectivo).

