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
| `FRONTEND_URL` | No (default: primer origen de `CORS_ORIGIN`) | `https://nido-smarthome.vercel.app` | URL base del frontend para el link del email de confirmación de cuenta (redirige a `/login`). Ver *Emails de confirmación* |

Notas de seguridad:

* La contraseña dentro de `DATABASE_URL` da acceso total a la base: nunca commitearla ni compartirla por canales públicos.
* La API **no** usa la *Secret key* (`sb_secret_...`, antes `service_role`): da acceso total y saltea RLS. La validación de entorno rechaza una Secret key cargada por error en `SUPABASE_PUBLISHABLE_KEY`. Toda consulta se filtra por el `user_id` extraído del JWT validado.
* En EC2 las variables se cargan en el entorno del proceso (archivo `.env` del servidor o configuración de PM2/Docker), nunca dentro de la imagen ni del repositorio.

### Emails de confirmación

Con la confirmación de email activa, el registro envía un link que primero confirma la cuenta en Supabase y después redirige a `<FRONTEND_URL>/login`, donde el frontend muestra el resultado. Para que Supabase acepte esa redirección, en el dashboard → *Authentication* → *URL Configuration*:

* **Site URL**: la URL del frontend en producción (o `http://localhost:5173` mientras no haya deploy). Es el destino por defecto: si queda en `http://localhost:3000`, los links llevan a la API.
* **Redirect URLs**: `http://localhost:5173/**` y la URL de Vercel con `/**`, para que funcionen el entorno local y el desplegado con el mismo proyecto.

---

## Desarrollo local

```bash
cd apps/backend
npm install
cp .env.example .env    # completar los valores
npm run start:dev       # API en http://localhost:3000 con recarga automática
```

| Script | Uso |
|---|---|
| `npm run check` | Lint + formato + tipos + tests (lo mismo que valida el CI) |
| `npm run lint:fix` / `npm run format` | Corrigen estilo y formato |
| `npm test` / `npm run test:watch` | Tests unitarios |
| `npm run build` y `npm run start:prod` | Compilar y ejecutar la versión de producción |

---

## Docker

La imagen se construye con el [`Dockerfile`](Dockerfile) multi-stage: compila con todas las dependencias y publica una imagen final liviana (Node 24 Alpine) con solo `dist/`, las dependencias de producción y el certificado de Supabase. Se ejecuta con un usuario sin privilegios y expone un `HEALTHCHECK` sobre `/health`.

Las credenciales **no** entran a la imagen (`.dockerignore` excluye `.env`): se inyectan al levantar el contenedor con [`docker-compose.yml`](docker-compose.yml), que lee `apps/backend/.env`.

```bash
cd apps/backend
docker compose up -d --build     # construir y levantar
docker compose ps                # estado (debe decir "healthy")
docker compose logs -f api       # logs
docker compose down              # detener
```

El contenedor publica el puerto solo en `127.0.0.1:3000`: en el servidor, el acceso público entra por Nginx con HTTPS.

---

## Despliegue en AWS EC2

### 1. Crear la instancia

| Opción | Valor recomendado |
|---|---|
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | `t2.micro` o `t3.micro` (capa gratuita) |
| Región | **`us-east-1`**, la misma que el pooler de Supabase (`aws-0-us-east-1`): menor latencia entre API y base |
| Par de claves | Crear uno y guardar el `.pem` (no se puede volver a descargar) |
| Security group | **22 (SSH)** solo desde tu IP · **80 (HTTP)** y **443 (HTTPS)** desde cualquier lugar. **No** abrir el 3000 |
| Almacenamiento | 20 GB gp3 |

Opcional: asociar una **Elastic IP** para que la IP pública no cambie al reiniciar la instancia.

### 2. Preparar el servidor

```bash
ssh -i nido.pem ubuntu@<IP_PUBLICA>

sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y docker.io docker-compose-v2 nginx git
sudo usermod -aG docker ubuntu   # usar docker sin sudo (requiere volver a entrar por SSH)

# Swap de 2 GB: con 1 GB de RAM, compilar la imagen puede quedarse sin memoria
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Código y variables de entorno

```bash
git clone https://github.com/AlejandroPedrosa/Nido-SmartHome.git
cd Nido-SmartHome/apps/backend
cp .env.example .env
nano .env        # completar con los valores reales
chmod 600 .env   # solo el usuario ubuntu puede leerlo
```

En producción, `CORS_ORIGIN` debe ser la URL del frontend en Vercel (por ejemplo `https://nido-smarthome.vercel.app`). `NODE_ENV` y `PORT` los fija `docker-compose.yml`.

### 4. Levantar la API

```bash
docker compose up -d --build
docker compose ps                     # esperar a que figure "healthy"
curl http://127.0.0.1:3000/health     # {"status":"ok",...}
```

Si el contenedor se reinicia en bucle, `docker compose logs api` muestra el motivo (por ejemplo, una variable de entorno inválida o la base inaccesible).

### 5. Nginx como proxy inverso

Crear `/etc/nginx/sites-available/nido-api`:

```nginx
server {
    listen 80;
    server_name api.tu-dominio.com;   # o la IP pública mientras no haya dominio

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nido-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl http://<IP_PUBLICA>/health
```

### 6. HTTPS (obligatorio para el frontend en Vercel)

El frontend en Vercel se sirve por HTTPS y el navegador **bloquea** las llamadas a una API por HTTP (contenido mixto). Para el certificado gratuito de Let's Encrypt hace falta un **nombre de dominio** que apunte a la IP de la instancia: un dominio propio o un subdominio gratuito (por ejemplo, DuckDNS). Con el registro DNS apuntando a la Elastic IP:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.tu-dominio.com   # configura HTTPS y la renovación automática
```

El frontend debe usar entonces `https://api.tu-dominio.com` como URL base de la API.

### 7. Actualizar a una nueva versión

```bash
cd ~/Nido-SmartHome && git pull
cd apps/backend && docker compose up -d --build
docker image prune -f    # borra imágenes viejas sin uso
```

### Checklist de producción

* [ ] `.env` del servidor completo, con `chmod 600` y fuera del repositorio.
* [ ] Security group sin el puerto 3000 abierto; SSH restringido a tu IP.
* [ ] `docker compose ps` en estado `healthy`.
* [ ] HTTPS activo y `CORS_ORIGIN` con la URL exacta del frontend.
* [ ] En Supabase, *Authentication → URL Configuration*: **Site URL** y **Redirect URLs** con la URL del frontend (para los links de confirmación de email).
