-- ==============================================================================
-- Pulso+ - Esquema Inicial de Base de Datos y Políticas RLS en Supabase
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES (profiles)
-- Vinculada 1:1 con la tabla auth.users de Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  currency TEXT DEFAULT 'CLP' NOT NULL,
  monthly_income NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TRIGGER AUTOMÁTICO PARA CREAR PERFIL TRAS REGISTRO EN SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, currency, monthly_income)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'CLP',
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLA DE CATEGORÍAS (categories)
-- Admite categorías globales del sistema (user_id = NULL) y privadas por usuario
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Semilla de Categorías del Sistema de Pulso+
INSERT INTO public.categories (id, user_id, name, icon, color, is_system)
VALUES
  ('food', NULL, 'Alimentación', 'utensils', '#cf684f', true),
  ('transport', NULL, 'Transporte', 'bus', '#477c91', true),
  ('home', NULL, 'Hogar', 'house', '#718a35', true),
  ('health', NULL, 'Salud', 'heart-pulse', '#ba5d71', true),
  ('entertainment', NULL, 'Entretenimiento', 'ticket', '#8265a5', true),
  ('shopping', NULL, 'Compras', 'shopping-bag', '#bf813a', true),
  ('supermarket', NULL, 'Supermercado', 'shopping-cart', '#34785f', true),
  ('fair', NULL, 'Feria', 'store', '#c26c43', true),
  ('education', NULL, 'Educación', 'book-open', '#52805e', true),
  ('services', NULL, 'Servicios', 'plug', '#5079a0', true),
  ('subscriptions', NULL, 'Suscripciones', 'repeat', '#8c6d44', true),
  ('small-expenses', NULL, 'Gastos hormiga', 'coffee', '#b56545', true),
  ('other', NULL, 'Otros', 'shapes', '#66736a', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_system = EXCLUDED.is_system;

-- 5. TABLA DE GASTOS FIJOS / RECURRENTES (fixed_expenses)
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.categories(id),
  frequency TEXT DEFAULT 'monthly' NOT NULL,
  due_day INTEGER,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA DE GASTOS REALIZADOS (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.categories(id),
  description TEXT DEFAULT '' NOT NULL,
  expense_date DATE NOT NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('fixed', 'variable')),
  fixed_expense_id UUID REFERENCES public.fixed_expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON public.expenses (user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user ON public.fixed_expenses (user_id);

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS DE SEGURIDAD (RLS)

-- Profiles: Cada usuario solo puede ver y editar su propio perfil
CREATE POLICY "Usuarios ven su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories: Categorías del sistema son públicas para usuarios autenticados;
-- categorías privadas solo las ve y administra su creador.
CREATE POLICY "Lectura de categorias globales y propias"
  ON public.categories FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Creacion de categorias privadas"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Modificacion de categorias privadas propias"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Eliminacion de categorias privadas propias"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Fixed Expenses: Acceso total exclusivamente a los registros del propio usuario
CREATE POLICY "Gestion total de gastos fijos propios"
  ON public.fixed_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expenses: Acceso total exclusivamente a los movimientos del propio usuario
CREATE POLICY "Gestion total de gastos propios"
  ON public.expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
