-- ============================================================
-- Migración 001 — Habilitar Row Level Security
-- Aplicar sobre bases creadas con una versión de schema.sql previa
-- a esta migración. Es idempotente: puede ejecutarse más de una vez.
-- ============================================================

-- Row Level Security: bloquea el acceso directo a las tablas desde la API
-- REST pública de Supabase (roles anon y authenticated). No se definen
-- policies a propósito: el único acceso permitido es el backend NestJS,
-- que se conecta con el rol postgres (dueño de las tablas, BYPASSRLS).
-- El aislamiento por user_id lo garantiza la API (ver base-de-datos.md §7).
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
