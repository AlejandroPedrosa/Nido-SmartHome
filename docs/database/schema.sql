-- ============================================================
-- NIDO SmartHome — Esquema de Base de Datos
-- PostgreSQL + Supabase (Auth)
-- ============================================================

-- Productos del inventario
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit VARCHAR(20) NOT NULL DEFAULT 'unidad' CHECK (unit IN ('g', 'kg', 'ml', 'l', 'unidad', 'paquete', 'botella')),
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  reorder_quantity DECIMAL(10, 2) NULL CHECK (reorder_quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_products_user_name UNIQUE (user_id, name)
);

-- Contenedores / espacios del hogar
CREATE TABLE containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_containers_user_name UNIQUE (user_id, name)
);

-- Relación muchos-a-muchos entre productos y contenedores
CREATE TABLE product_containers (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, container_id)
);

-- Recetas
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructions TEXT,
  servings INTEGER NOT NULL DEFAULT 1 CHECK (servings > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_recipes_user_name UNIQUE (user_id, name)
);

-- Ingredientes de recetas (relación receta-producto)
CREATE TABLE recipe_ingredients (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (recipe_id, product_id)
);

-- Movimientos de inventario (auditoría)
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_change DECIMAL(10, 2) NOT NULL CHECK (quantity_change != 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('manual', 'recipe_consumption', 'shopping')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listas de compras
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE
);

-- Items de la lista de compras
CREATE TABLE shopping_list_items (
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_quantity DECIMAL(10, 2) NOT NULL CHECK (suggested_quantity > 0),
  purchased BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (shopping_list_id, product_id)
);

-- Garantizar una única lista de compras activa por usuario
CREATE UNIQUE INDEX shopping_lists_one_active_per_user
  ON shopping_lists (user_id)
  WHERE is_purchased = FALSE;

-- Índices para consultas por usuario y por producto
CREATE INDEX products_user_id_idx ON products (user_id);
CREATE INDEX containers_user_id_idx ON containers (user_id);
CREATE INDEX recipes_user_id_idx ON recipes (user_id);
CREATE INDEX shopping_lists_user_id_idx ON shopping_lists (user_id);
CREATE INDEX inventory_movements_product_id_idx ON inventory_movements (product_id);
CREATE INDEX recipe_ingredients_product_id_idx ON recipe_ingredients (product_id);
CREATE INDEX shopping_list_items_product_id_idx ON shopping_list_items (product_id);
CREATE INDEX product_containers_container_id_idx ON product_containers (container_id);
