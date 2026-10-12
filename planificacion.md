# Especificación técnica — Aplicación llamada "Pulso+"de control de gastos personales

## 1. Objetivo del proyecto

Construir una aplicación web de finanzas personales que permita a cada usuario registrar, organizar y analizar sus gastos mensuales y diarios.

La aplicación debe ayudar al usuario a responder:

- ¿Cuánto dinero gasto al mes?
- ¿Cuánto de mis gastos son fijos?
- ¿Cuánto gasto en compras variables o gastos hormiga?
- ¿En qué categorías gasto más?
- ¿Qué días de la semana gasto más?
- ¿Cómo estoy gastando respecto del mes anterior?
- ¿Cuánto dinero me queda disponible?
- ¿Qué patrones de gasto puedo identificar?

El foco inicial NO es conectar bancos ni importar movimientos automáticamente. El MVP debe permitir que el usuario ingrese sus gastos manualmente de forma rápida y sencilla.

---

# 2. Principios del proyecto

## 2.1 MVP primero

Construir primero una versión funcional, sencilla y mantenible.

No implementar inicialmente:

- Integración bancaria.
- Open Banking.
- Inteligencia artificial.
- Aplicaciones móviles nativas.
- Microservicios.
- Kubernetes.
- Infraestructura compleja.
- Sistemas de pagos.
- Integraciones externas innecesarias.

La arquitectura debe permitir agregar estas capacidades posteriormente sin tener que reescribir toda la aplicación.

## 2.2 Prioridad: costo cero o mínimo

El proyecto debe comenzar utilizando las capas gratuitas disponibles.

Arquitectura inicial:

```text
GitHub
   |
   | CI/CD
   v
GitHub Actions
   |
   v
Vercel
   |
   +----------------------+
   |                      |
   v                      v
Next.js Frontend       API / Serverless Functions
                              |
                              v
                         Supabase
                              |
                    +---------+---------+
                    |                   |
                    v                   v
                PostgreSQL           Auth
```

### Servicios iniciales

- Código fuente: GitHub
- CI/CD: GitHub Actions
- Frontend: Next.js
- Backend/API inicial: Next.js API Routes / Route Handlers desplegados como Vercel Functions
- Hosting: Vercel
- Base de datos: Supabase PostgreSQL
- Autenticación: Supabase Auth
- ORM opcional: Prisma o Drizzle, pero elegir solamente uno si realmente aporta valor
- Lenguaje: TypeScript

No crear un backend separado durante el MVP.

La aplicación debe estar diseñada para que posteriormente el backend pueda migrarse a un servicio independiente sin cambiar la lógica del dominio.

---

# 3. Arquitectura inicial

## 3.1 Monolito modular

Usar un único repositorio y una única aplicación Next.js.

No crear microservicios.

La separación debe ser lógica:

```text
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── expenses/
│   ├── fixed-expenses/
│   ├── categories/
│   ├── settings/
│   └── api/
│
├── components/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── expenses/
│   ├── fixed-expenses/
│   ├── categories/
│   └── analytics/
│
├── lib/
│   ├── supabase/
│   ├── validations/
│   ├── calculations/
│   └── utils/
│
├── types/
└── config/
```

La lógica de negocio no debe quedar mezclada directamente con los componentes visuales.

---

# 4. Stack tecnológico

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Librería de componentes accesible y liviana, preferentemente shadcn/ui
- Recharts para gráficos, si resulta necesario

## Backend

Inicialmente:

- Next.js Route Handlers / API
- Vercel Functions

La API debe utilizar servicios y casos de uso separados de la capa visual.

## Base de datos

Supabase PostgreSQL.

## Autenticación

Supabase Auth.

Métodos iniciales:

- Email + password
- Recuperación de contraseña

Dejar preparada la arquitectura para agregar posteriormente Google OAuth.

## Validación

Zod.

## Testing

- Vitest para unit tests
- Playwright para pruebas E2E críticas

## Calidad

- ESLint
- Prettier
- TypeScript strict mode

---

# 5. Usuarios

Cada usuario debe tener sus propios datos.

Un usuario nunca puede acceder a:

- Gastos de otro usuario.
- Gastos fijos de otro usuario.
- Categorías privadas de otro usuario.
- Información financiera de otro usuario.

Implementar Row Level Security (RLS) en Supabase.

No confiar únicamente en validaciones del frontend.

Toda autorización debe ser validada en backend/base de datos.

---

# 6. Modelo de datos

Diseñar la base de datos utilizando PostgreSQL.

## 6.1 profiles

```text
id UUID PRIMARY KEY
full_name TEXT
currency TEXT DEFAULT 'CLP'
monthly_income NUMERIC(14,2) NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`id` debe relacionarse con `auth.users`.

---

## 6.2 categories

```text
id UUID PRIMARY KEY
user_id UUID NULL
name TEXT
icon TEXT NULL
color TEXT NULL
is_system BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

Debe existir soporte para categorías del sistema y categorías creadas por el usuario.

Ejemplos:

- Alimentación
- Transporte
- Hogar
- Salud
- Entretenimiento
- Compras
- Educación
- Servicios
- Suscripciones
- Gastos hormiga
- Otros

---

## 6.3 fixed_expenses

Representa gastos recurrentes.

```text
id UUID PRIMARY KEY
user_id UUID
name TEXT
amount NUMERIC(14,2)
category_id UUID
frequency TEXT
due_day INTEGER
start_date DATE
end_date DATE NULL
active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

Frecuencias iniciales:

- monthly
- weekly
- yearly

El MVP debe enfocarse principalmente en mensual.

Ejemplos:

- Arriendo
- Luz
- Agua
- Gas
- Internet
- Celular
- Streaming
- Seguros
- Suscripciones

---

## 6.4 expenses

Representa gastos realizados.

```text
id UUID PRIMARY KEY
user_id UUID
amount NUMERIC(14,2)
category_id UUID
description TEXT
expense_date DATE
expense_type TEXT
payment_method TEXT NULL
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

`expense_type`:

- fixed
- variable

Aunque los gastos fijos tengan una configuración recurrente, generar registros de gasto concretos por período cuando corresponda.

Esto permitirá analizar correctamente cada mes.

---

## 6.5 payment_methods

Opcional en MVP, pero dejar preparada la arquitectura.

```text
id UUID PRIMARY KEY
user_id UUID
name TEXT
type TEXT
created_at TIMESTAMPTZ
```

Tipos posibles:

- cash
- debit
- credit
- transfer
- other

---

# 7. Reglas de negocio

## Gastos fijos

El usuario puede crear:

```text
Nombre: Internet
Monto: $25.000
Día de vencimiento: 10
Frecuencia: Mensual
Categoría: Servicios
```

La aplicación debe mostrar ese gasto en el período correspondiente.

No duplicar gastos accidentalmente.

Debe existir un mecanismo idempotente para generar los gastos recurrentes.

---

# 8. Gastos variables

El usuario debe poder registrar rápidamente:

```text
Monto: $7.500
Categoría: Transporte
Descripción: Uber
Fecha: 2026-10-05
Tipo: Variable
Método de pago: Débito
```

La creación debe ser rápida.

El formulario debe poder utilizarse cómodamente desde teléfono.

---

# 9. Dashboard

El dashboard es el principal valor de la aplicación.

Debe mostrar como mínimo:

## Resumen mensual

```text
Ingresos
Gastos
Disponible
% del ingreso gastado
```

Ejemplo:

```text
Ingresos       $1.500.000
Gastos           $987.450
Disponible       $512.550
Gastado             65,8%
```

---

# 10. Distribución de gastos

Mostrar:

```text
Gastos fijos
Gastos variables
```

Ejemplo:

```text
Fijos       $650.000
Variables   $337.450
```

También mostrar porcentajes.

---

# 11. Gastos por categoría

Mostrar ranking o gráfico:

```text
Hogar              $650.000
Alimentación        $180.000
Transporte           $95.000
Entretenimiento      $35.000
Gastos hormiga       $27.450
```

---

# 12. Gastos por día de la semana

Calcular el total gastado por:

- Lunes
- Martes
- Miércoles
- Jueves
- Viernes
- Sábado
- Domingo

Mostrarlo en un gráfico.

Debe ser posible detectar patrones como:

> "Tus mayores gastos ocurren los viernes."

No mostrar afirmaciones engañosas cuando la cantidad de datos sea insuficiente.

---

# 13. Gastos hormiga

Crear una vista específica para gastos pequeños.

Ejemplo:

```text
Café             $3.000
Bebida           $2.000
Snack            $2.500
Uber             $6.500
Delivery        $12.000
```

Mostrar:

```text
Total gastos hormiga del mes: $126.500
```

Y:

```text
Representan el X% de tus gastos.
```

La clasificación debe poder ser manual mediante categoría.

No asumir automáticamente que un gasto pequeño es necesariamente un gasto hormiga.

---

# 14. Comparación mensual

Permitir comparar:

```text
Mes actual vs mes anterior
```

Ejemplo:

```text
Septiembre     $1.070.000
Octubre          $987.450

Variación: -7,7%
```

Comparar:

- Total
- Fijos
- Variables
- Categorías
- Gastos hormiga

También permitir seleccionar dos meses manualmente posteriormente.

---

# 15. Insights

El MVP puede incluir insights determinísticos simples.

Ejemplos:

```text
Tus gastos aumentaron 12% respecto al mes anterior.

Tus gastos de alimentación aumentaron 24%.

El viernes es tu día con mayor gasto.

Tus gastos hormiga representan el 8,4% de tus gastos.
```

No utilizar IA para esto inicialmente.

Construir primero reglas matemáticas confiables.

Posteriormente se podrá agregar una capa de IA.

---

# 16. UX

La aplicación debe ser:

- Responsive
- Mobile-first
- Simple
- Rápida
- Clara
- Accesible

El usuario debe poder registrar un gasto en pocos segundos.

La acción principal debe estar siempre visible:

```text
+ Agregar gasto
```

En móvil podría ser un botón flotante.

---

# 17. Navegación

Crear una navegación sencilla:

```text
Dashboard
Gastos
Gastos fijos
Categorías
Análisis
Configuración
```

En móvil utilizar navegación inferior si resulta conveniente:

```text
Inicio | Gastos | + | Análisis | Perfil
```

---

# 18. Pantallas

## Login

- Email
- Password
- Ingresar
- Crear cuenta
- Recuperar contraseña

## Registro

- Nombre
- Email
- Password
- Moneda

## Dashboard

Mostrar resumen y gráficos.

## Gastos

- Lista
- Filtros
- Buscar
- Crear
- Editar
- Eliminar

Filtros:

- Mes
- Categoría
- Tipo
- Método de pago

## Nuevo gasto

Formulario rápido.

## Gastos fijos

- Lista
- Crear
- Editar
- Activar/desactivar
- Eliminar

## Análisis

Gráficos y comparación histórica.

## Configuración

- Perfil
- Moneda
- Ingreso mensual
- Categorías
- Métodos de pago
- Cerrar sesión

---

# 19. Seguridad

Implementar desde el principio:

- Supabase Auth
- RLS
- Validación Zod
- Variables de entorno
- No exponer service role key al frontend
- No guardar contraseñas manualmente
- Protección de rutas
- Validación de ownership
- Sanitización de entradas

Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

La `SUPABASE_SERVICE_ROLE_KEY` jamás debe exponerse al navegador.

---

# 20. API

Crear una capa de servicios.

Ejemplo:

```text
GET    /api/expenses
POST   /api/expenses
GET    /api/expenses/:id
PATCH  /api/expenses/:id
DELETE /api/expenses/:id
```

Gastos fijos:

```text
GET    /api/fixed-expenses
POST   /api/fixed-expenses
PATCH  /api/fixed-expenses/:id
DELETE /api/fixed-expenses/:id
```

Dashboard:

```text
GET /api/dashboard?month=2026-10
```

Analytics:

```text
GET /api/analytics/monthly
GET /api/analytics/categories
GET /api/analytics/weekdays
```

Sin embargo, si determinadas consultas pueden realizarse directamente de forma segura mediante Supabase, no crear endpoints innecesarios.

La API debe existir principalmente para encapsular lógica de negocio que posteriormente podría migrarse a un backend separado.

---

# 21. GitHub

el repositorio es el siguiente: git@github.com:riavasystem/pulso.git
```

Branches:

```text
main
develop
feature/*
fix/*
```

No trabajar directamente sobre `main`.

Configurar Pull Requests.

---

# 22. GitHub Actions

Crear workflows:

```text
.github/
└── workflows/
    ├── ci.yml
    └── deploy.yml
```

## CI

Cada Pull Request debe ejecutar:

```text
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Si alguna etapa falla, el PR no debe considerarse válido.

---

# 23. Vercel

Conectar el repositorio de GitHub con Vercel.

Objetivo:

```text
Pull Request
      |
      v
GitHub Actions
      |
      v
Tests
      |
      v
Vercel Preview
```

Producción:

```text
main
 |
 v
Vercel Production
```

Usar variables de entorno separadas para:

- Development
- Preview
- Production

No subir `.env` al repositorio.

Crear `.env.example`.

---

# 24. Backend en Vercel

IMPORTANTE:

Para el MVP NO crear un servidor Express, NestJS o FastAPI separado.

Usar:

```text
Next.js
+
Route Handlers
+
Vercel Functions
```

Esto permite mantener frontend y backend en el mismo proyecto y repositorio.

La arquitectura debe permitir posteriormente reemplazar:

```text
Next.js API
     |
     v
Vercel Functions
```

por:

```text
Next.js Frontend
     |
     v
API Backend independiente
     |
     v
PostgreSQL
```

sin cambiar las reglas de negocio.

---

# 25. Estrategia futura de desacoplamiento

Cuando aumente el tráfico o la complejidad:

### Fase 1

```text
Next.js
  |
  +-- Frontend
  +-- API
  |
  v
Supabase
```

### Fase 2

```text
Next.js
  |
  v
Backend API independiente
  |
  v
PostgreSQL
```

### Fase 3

Si realmente es necesario:

```text
Frontend
    |
API Gateway
    |
+---+------------------+
|                      |
v                      v
Users Service       Expenses Service
                         |
                         v
                    PostgreSQL
```

No implementar las fases 2 o 3 hasta que exista una razón técnica real.

---

# 26. Moneda

El MVP debe comenzar soportando CLP.

Sin embargo, no hardcodear `$` en la lógica.

Usar:

```text
currency = CLP
```

y una capa de formateo.

Ejemplo:

```text
$ 35.000
```

Posteriormente:

```text
CLP
USD
EUR
ARS
BRL
```

---

# 27. Fechas

Usar fechas de forma consistente.

Guardar timestamps en UTC cuando corresponda.

Para gastos financieros usar una fecha local de gasto:

```text
expense_date DATE
```

Evitar problemas de timezone para registros diarios.

---

# 28. Manejo de dinero

NO utilizar `float` para cálculos monetarios.

Usar:

- NUMERIC en PostgreSQL
- Decimal en backend cuando sea necesario

Evitar errores como:

```text
0.1 + 0.2 = 0.30000000000000004
```

---

# 29. Seeds

Crear datos iniciales para desarrollo:

Categorías:

```text
Alimentación
Transporte
Hogar
Salud
Entretenimiento
Compras
Educación
Servicios
Suscripciones
Gastos hormiga
Otros
```

Crear usuario de prueba únicamente para desarrollo/test.

No introducir datos ficticios en producción.

---

# 30. Datos demo

Agregar una opción de desarrollo para cargar datos demo:

```text
npm run seed
```

Esto permitirá demostrar:

- Gastos de varios meses
- Gastos fijos
- Gastos variables
- Diferencias entre meses
- Gráficos
- Insights

---

# 31. Tests

Crear pruebas para:

### Cálculos

- Total mensual
- Total fijo
- Total variable
- Porcentaje
- Comparación mensual
- Gasto por categoría
- Gasto por día de semana

### Seguridad

Verificar que:

```text
Usuario A != Usuario B
```

Un usuario nunca puede consultar los gastos del otro.

### E2E

Flujo:

```text
Registro
   ↓
Login
   ↓
Crear gasto
   ↓
Ver dashboard
   ↓
Editar gasto
   ↓
Eliminar gasto
```

---

# 32. Performance

No realizar consultas innecesarias.

Para dashboard:

- Evitar traer todos los gastos si solo se necesitan agregaciones.
- Utilizar consultas SQL agregadas cuando corresponda.
- Crear índices.

Índices sugeridos:

```text
expenses(user_id)
expenses(user_id, expense_date)
expenses(user_id, category_id)
fixed_expenses(user_id)
```

---

# 33. Observabilidad

En MVP:

- Logs de Vercel
- Logs básicos de errores
- Manejo consistente de errores

Preparar arquitectura para agregar posteriormente:

- Sentry
- Analytics
- Monitoring

No agregar herramientas pagadas innecesariamente.

---

# 34. Manejo de errores

Crear respuestas consistentes.

Ejemplo:

```json
{
  "error": {
    "code": "EXPENSE_NOT_FOUND",
    "message": "No se encontró el gasto"
  }
}
```

Nunca devolver información sensible.

No mostrar stack traces al usuario.

---

# 35. Estados de UI

Todos los componentes que consuman datos deben manejar:

```text
Loading
Success
Empty
Error
```

Ejemplo:

```text
No tienes gastos registrados este mes.
```

No mostrar un dashboard vacío como si fuera un error.

---

# 36. Diseño visual

Crear un diseño moderno y limpio.

Características:

- Fondo claro
- Cards
- Tipografía legible
- Buen contraste
- Responsive
- Iconografía simple
- Gráficos fáciles de interpretar

No sobrecargar el dashboard.

La información más importante debe verse primero:

```text
Ingresos
Gastos
Disponible
```

Después:

```text
Fijos vs Variables
Categorías
Días de mayor gasto
Comparación mensual
Insights
```

---

# 37. Privacidad

Los datos financieros son sensibles.

Principios:

- Cada usuario solamente puede ver sus propios datos.
- No utilizar información financiera para publicidad.
- No registrar información financiera innecesaria en logs.
- No enviar datos financieros a servicios externos sin necesidad.
- Mantener las claves secretas exclusivamente en servidor.

Agregar posteriormente:

- Exportación de datos
- Eliminación de cuenta
- Eliminación completa de datos

---

# 38. Futuras funcionalidades

NO implementar inicialmente, pero diseñar pensando en ellas:

## Importación

```text
CSV
Excel
```

## Integración bancaria

Posiblemente mediante Open Banking cuando el producto tenga usuarios.

## Notificaciones

```text
Has gastado el 80% de tu presupuesto.
```

## Presupuestos

```text
Alimentación
Presupuesto: $200.000
Gastado: $180.000
Disponible: $20.000
```

## Metas

```text
Meta: Viaje
Objetivo: $1.000.000
Ahorrado: $350.000
```

## IA

Un asistente podría responder:

> ¿Por qué gasté más este mes?

> ¿Dónde podría reducir gastos?

> ¿Cuál fue mi categoría que más aumentó?

La IA debe consumir datos agregados o estrictamente necesarios y respetar la privacidad del usuario.

---

# 39. Roadmap

## Sprint 1 — Fundación

- Usar repositorio git@github.com:riavasystem/pulso.git
- Next.js
- TypeScript
- Tailwind
- Supabase
- Auth
- ESLint
- Prettier
- GitHub Actions
- Vercel

## Sprint 2 — Datos

- Database schema
- Migrations
- RLS
- Categories
- Profiles
- Expenses
- Fixed expenses

## Sprint 3 — Gastos

- CRUD expenses
- CRUD fixed expenses
- Filtros
- Validaciones

## Sprint 4 — Dashboard

- Resumen
- Fijos vs variables
- Categorías
- Días de semana
- Gráficos

## Sprint 5 — Analytics

- Comparación mensual
- Gastos hormiga
- Insights
- Tendencias

## Sprint 6 — Calidad

- Unit tests
- E2E
- Seguridad
- Performance
- UX mobile
- Accessibility

## Sprint 7 — Deploy

- Production
- Environment variables
- CI/CD
- Documentation

---

# 40. Definition of Done

Una funcionalidad está terminada cuando:

- Funciona.
- Tiene validación.
- Tiene manejo de errores.
- Tiene estados loading/empty/error.
- Respeta RLS.
- Tiene tests cuando corresponda.
- Tiene TypeScript sin errores.
- Pasa ESLint.
- Pasa build.
- Es responsive.
- No expone secretos.
- Está documentada si agrega comportamiento relevante.

---

# 41. Reglas para la IA desarrolladora

La IA debe actuar como un desarrollador senior.

Antes de escribir código:

1. Revisar la arquitectura.
2. Identificar dependencias.
3. Proponer cambios cuando exista un problema técnico.
4. No introducir complejidad innecesaria.
5. No inventar APIs.
6. No utilizar librerías innecesarias.
7. Mantener TypeScript strict.
8. Priorizar seguridad.
9. Mantener separación entre UI, dominio y persistencia.
10. Mantener compatibilidad con una futura separación del backend.

Cuando una tarea sea grande:

```text
Analizar
↓
Proponer implementación
↓
Implementar por etapas
↓
Testear
↓
Corregir
↓
Documentar
```

No generar cientos de archivos innecesariamente.

No modificar archivos no relacionados con la tarea.

---

# 42. Entregables iniciales

La IA debe crear:

```text
README.md
ARCHITECTURE.md
DATABASE.md
SECURITY.md
.env.example
```

Además:

```text
.github/workflows/ci.yml
```

Y las migraciones SQL necesarias.

---

# 43. README

El README debe explicar:

- Qué hace el proyecto.
- Stack.
- Arquitectura.
- Requisitos.
- Instalación local.
- Variables de entorno.
- Configuración de Supabase.
- Ejecución local.
- Tests.
- Build.
- Deploy.
- CI/CD.

---

# 44. Resultado esperado del MVP

Al finalizar el MVP un usuario debe poder:

```text
Crear cuenta
    ↓
Configurar perfil
    ↓
Agregar gastos fijos
    ↓
Registrar gastos diarios
    ↓
Categorizar gastos
    ↓
Ver dashboard
    ↓
Ver gastos por categoría
    ↓
Ver gastos por día
    ↓
Ver gastos hormiga
    ↓
Comparar meses
```

La aplicación debe ser completamente funcional y desplegable.

---

# 45. Restricción de infraestructura

Objetivo inicial:

```text
$0 de infraestructura
```

Siempre que los límites gratuitos de los proveedores lo permitan.

No agregar servicios de pago por defecto.

Si una funcionalidad requiere pasar a un plan pagado:

1. Explicar por qué.
2. Indicar el límite que se alcanzó.
3. Proponer una alternativa gratuita cuando exista.
4. No habilitar costos automáticamente.

---

# 46. Decisión arquitectónica importante

Para este MVP:

**Frontend y backend pueden vivir dentro del mismo proyecto Next.js en Vercel.**

No considerar esto una mala práctica.

Es una decisión deliberada para reducir:

- Costos
- Complejidad
- Tiempo de desarrollo
- Cantidad de infraestructura
- Problemas de deployment

La separación lógica del código permitirá migrar posteriormente la API a otro servicio si el crecimiento lo justifica.

---

# 47. Primera tarea de la IA

Antes de implementar funcionalidades, realizar solamente:

1. Crear la estructura del proyecto.
2. Configurar Next.js + TypeScript.
3. Configurar Tailwind.
4. Configurar ESLint y Prettier.
5. Configurar Supabase.
6. Crear `.env.example`.
7. Crear documentación inicial.
8. Crear GitHub Actions CI.
9. Crear la estructura modular.
10. Crear un README inicial.
11. Verificar `npm run lint`.
12. Verificar `npm run typecheck`.
13. Verificar `npm run build`.

No implementar todavía el dashboard completo.

Después de completar esta fase, presentar un resumen de lo realizado y esperar la siguiente instrucción.

---

# 48. Criterio general

Construir una aplicación pequeña, limpia y profesional antes que una aplicación grande y compleja.

El objetivo no es demostrar cuántas tecnologías pueden utilizarse.

El objetivo es construir un producto financiero personal:

**simple de usar, seguro, rápido, mantenible y preparado para crecer.**
