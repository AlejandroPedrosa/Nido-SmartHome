# Backend — NIDO SmartHome

API REST construida con NestJS, TypeScript y conexión a PostgreSQL (Supabase Cloud).

## Módulos del sistema
* `src/auth/`: Gestión de usuarios, autenticación y guards de Supabase JWT.
* `src/products/`: CRUD de productos, categorización y control de existencias.
* `src/containers/`: Gestión de espacios físicos y asignación de productos.
* `src/recipes/`: Recetas culinarias, ingredientes y despacho atómico (`/cook`).
* `src/inventory/`: Registro inmutable de movimientos y pool transaccional de persistencia (`pg`).
* `src/shopping/`: Generación y liquidación de listas de compras.
* `src/common/`: Guards, pipes de validación y filtros globales.
* `src/database/`: Pool de conexiones a PostgreSQL y cliente Supabase.
