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

---

## Base de datos: Supabase Cloud

### Decisión: un único proyecto

El backend usa **un solo proyecto de Supabase Cloud** (`nido`), compartido por el desarrollo local y el backend desplegado en AWS EC2. Para el alcance académico del MVP no se justifica mantener ambientes separados de desarrollo y producción.

* **Sin infraestructura local:** no se usa Supabase CLI ni Docker. La API solo necesita variables de entorno para conectarse.
* **Datos separados sin otro proyecto:** cada integrante prueba con su propio usuario. El aislamiento por `user_id` (reglas MT-01 a MT-03) impide que los datos se mezclen. Para la presentación se usa un usuario `demo` exclusivo.
* **Escalable si hace falta:** separar ambientes más adelante solo requiere crear otro proyecto, correr los mismos scripts SQL y cambiar las variables de entorno. El código no cambia.
* **Plan gratuito:** Supabase pausa los proyectos sin actividad durante unos 7 días. Antes de cada entrega o demo, ingresar al dashboard y reactivarlo si está pausado.

### Inicializar el esquema

1. Crear el proyecto `nido` en [supabase.com](https://supabase.com) y guardar la contraseña de la base de datos.
2. Abrir el **SQL Editor** del proyecto.
3. Pegar y ejecutar el contenido completo de [`docs/database/schema.sql`](../../docs/database/schema.sql).
4. Verificar en el **Table Editor** que existan las 8 tablas: `products`, `containers`, `product_containers`, `recipes`, `recipe_ingredients`, `inventory_movements`, `shopping_lists` y `shopping_list_items`.

Los cambios posteriores al esquema se versionan como scripts incrementales en `docs/database/migrations/` (`001_descripcion.sql`, `002_descripcion.sql`, ...) y se ejecutan en orden desde el SQL Editor. `schema.sql` se mantiene actualizado con el estado final del esquema.

### Conexión desde la API

* **`pg` (datos):** se conecta mediante el **Session pooler** de Supabase (puerto `5432`). Soporta transacciones y bloqueos `SELECT ... FOR UPDATE`, necesarios para cocinar recetas y confirmar compras. No usar el Transaction pooler (puerto `6543`): no conserva la sesión entre sentencias.
* **`@supabase/supabase-js` (identidad):** se usa únicamente en el módulo `auth` para registro, login, refresh, logout y validación de tokens.
* **SSL verificado:** la conexión exige SSL y el pool valida el certificado del servidor contra la CA raíz de Supabase, que no forma parte del almacén de certificados de Node. Para obtenerla: Dashboard → *Project Settings* → *Database* → *SSL Configuration* → **Download certificate**, y guardarla como `apps/backend/certs/supabase-ca.crt`. Es un certificado público (no es un secreto) y se versiona en el repositorio para que funcione igual en local, CI y EC2. Sin él, la API no arranca (`self-signed certificate in certificate chain`).
* No agregar `?sslmode=...` a `DATABASE_URL`: anularía la configuración SSL del pool.

---

## Variables de entorno

La API lee su configuración de un archivo `.env` en `apps/backend/`. Ese archivo **no se versiona**: el repositorio incluye un `.env.example` con las claves vacías como referencia.

| Variable | Obligatoria | Ejemplo | Dónde se obtiene |
|---|---|---|---|
| `PORT` | No (default `3000`) | `3000` | Puerto HTTP de la API |
| `DATABASE_URL` | Sí | `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres` | Dashboard → botón **Connect** → *Session pooler* |
| `DATABASE_SSL_CA_PATH` | Recomendada | `certs/supabase-ca.crt` | Ruta (relativa a `apps/backend`) del certificado raíz de Supabase. Ver *Conexión desde la API* |
| `SUPABASE_URL` | Sí | `https://<project-ref>.supabase.co` | Dashboard → *Project Settings* → *Data API* → *Project URL*. Solo la URL base, **sin** `/rest/v1` |
| `SUPABASE_PUBLISHABLE_KEY` | Sí | `sb_publishable_...` | Dashboard → *Project Settings* → *API Keys* → *Publishable key* (reemplaza a la antigua clave `anon`) |
| `CORS_ORIGIN` | Sí | `http://localhost:5173` | URL del frontend (Vite en local, dominio de Vercel en producción) |

Notas de seguridad:

* La contraseña dentro de `DATABASE_URL` da acceso total a la base: nunca commitearla ni compartirla por canales públicos.
* La API **no** usa la *Secret key* (`sb_secret_...`, antes `service_role`): da acceso total y saltea RLS. La validación de entorno rechaza una Secret key cargada por error en `SUPABASE_PUBLISHABLE_KEY`. Toda consulta se filtra por el `user_id` extraído del JWT validado.
* En EC2 las variables se cargan en el entorno del proceso (archivo `.env` del servidor o configuración de PM2/Docker), nunca dentro de la imagen ni del repositorio.
