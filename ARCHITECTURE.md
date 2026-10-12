# Arquitectura

## Decisión actual

Pulso+ comienza como un monolito modular en Next.js. La interfaz y los Route Handlers viven en la misma aplicación y se despliegan como funciones de Vercel; Supabase ofrece PostgreSQL y Auth. No se crea un servidor independiente ni microservicios para el MVP.

## Límites de módulos

```text
src/
├── app/                 Rutas, layouts y Route Handlers
├── components/          Componentes visuales compartidos
├── features/            Capacidades por dominio
├── lib/
│   ├── supabase/        Clientes Supabase de servidor y navegador
│   ├── validations/    Esquemas Zod
│   ├── calculations/   Reglas y agregaciones de dominio
│   └── utils/           Utilidades sin estado
├── types/               Tipos compartidos
└── config/              Configuración de la aplicación
```

La UI no debe contener reglas financieras ni acceder directamente a secretos. Los casos de uso y validaciones se mantendrán fuera de los componentes para facilitar una migración futura de la API.

## Datos y autenticación

Los clientes Supabase usan `@supabase/ssr` y la clave pública. La autorización de datos deberá imponerse con RLS y verificaciones del lado servidor; ocultar elementos en la UI no constituye autorización. La service-role key queda reservada a operaciones servidor explícitamente justificadas.

## Evolución

Mientras el volumen y la complejidad no lo justifiquen, se conserva Next.js + Vercel Functions + Supabase. Si la API se separa, las reglas de dominio y contratos deben poder trasladarse sin rehacer la UI.
