# Datos

## Persistencia prevista

PostgreSQL administrado por Supabase. Las fechas de gasto se guardan como `DATE` local; timestamps de auditoría usan `TIMESTAMPTZ`. Montos se almacenan como `NUMERIC(14,2)`, nunca como punto flotante.

## Entidades del MVP

- `profiles`: perfil vinculado uno a uno con `auth.users`, moneda (CLP por defecto) e ingreso mensual opcional.
- `categories`: categorías globales del sistema y categorías privadas del usuario.
- `fixed_expenses`: configuración recurrente, frecuencia, vencimiento y vigencia.
- `expenses`: movimientos realizados con dueño, categoría, fecha, tipo y monto.
- `payment_methods`: métodos privados opcionales.

## Reglas para migraciones

Las migraciones SQL versionadas y las políticas RLS forman parte de la etapa de datos del roadmap. Cada tabla con datos personales debe asociar filas a `auth.uid()`; categorías del sistema pueden leerse globalmente, pero no modificarse por usuarios. Las claves foráneas deben impedir referenciar categorías ajenas. La generación de gastos recurrentes deberá ser idempotente por gasto fijo y período.

Índices iniciales previstos: `expenses(user_id, expense_date)`, `expenses(user_id, category_id)` y `fixed_expenses(user_id)`. No se cargan datos demo ni movimientos ficticios en esta etapa.
