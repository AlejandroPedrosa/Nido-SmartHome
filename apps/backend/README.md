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

El contenedor publica el puerto solo en `127.0.0.1:3000`: en el servidor, el acceso público entra por Nginx con HTTPS (ver *Despliegue en producción*).

---

## Despliegue en producción

```text
Vercel (frontend, rama main) ──HTTPS──▶ nido-api.duckdns.org
                                          │
                              EC2: Nginx (TLS, Let's Encrypt)
                                          │ 127.0.0.1:3000
                              Docker: API NestJS ──▶ Supabase Cloud
```

* **Producción sale de `main`.** `develop` es la rama de integración; una versión se publica con un PR `develop → main`.
* **Frontend**: Vercel despliega `main` por su integración con GitHub (ver [`apps/frontend/README.md`](../frontend/README.md)).
* **Backend**: el workflow [`backend-deploy.yml`](../../.github/workflows/backend-deploy.yml) despliega en EC2 cada push a `main` que pasa la CI (ver *Despliegue continuo*).

Los pasos 1 a 6 se hacen una sola vez.

### 1. Crear la instancia EC2

| Opción | Valor recomendado |
|---|---|
| AMI | Ubuntu Server 24.04 LTS |
| Tipo | `t3.micro` (capa gratuita) |
| Región | **`us-east-1`**, la misma que el pooler de Supabase (`aws-0-us-east-1`): menor latencia entre API y base |
| Par de claves | Crear uno y guardar el `.pem` (no se puede volver a descargar) |
| Security group | **22 (SSH)**, **80 (HTTP)** y **443 (HTTPS)** desde cualquier lugar. **No** abrir el 3000 |
| Almacenamiento | 20 GB gp3 |

Asociar una **Elastic IP** a la instancia: el DNS apunta a ella y no cambia al reiniciar. Una Elastic IP **sin asociar** genera costo: liberarla si se elimina la instancia.

El puerto 22 queda abierto a internet porque los runners de GitHub Actions no tienen IP fija. Es aceptable porque Ubuntu en EC2 solo admite autenticación por clave (sin contraseñas) y se suma `fail2ban` (paso 3).

> **Costos:** antes de crear la instancia, en *Billing and Cost Management → Budgets* crear un **Zero spend budget** (avisa por email ante el primer gasto) y activar las alertas de la capa gratuita en *Billing preferences*.

### 2. Subdominio en DuckDNS

1. Ingresar a [duckdns.org](https://www.duckdns.org) (con GitHub o Google) y crear el subdominio, por ejemplo `nido-api` → `nido-api.duckdns.org`.
2. En **current ip** cargar la **Elastic IP** y guardar (*update ip*).
3. Verificar desde la computadora: `dig +short nido-api.duckdns.org` debe devolver la Elastic IP.

Con Elastic IP la dirección es fija: no hace falta el script de actualización periódica de DuckDNS. Si el subdominio es otro, reemplazarlo en este documento, en [`deploy/nginx/nido-api.conf`](deploy/nginx/nido-api.conf) y en las variables de Vercel y GitHub.

### 3. Preparar el servidor

```bash
ssh -i nido.pem ubuntu@<ELASTIC_IP>

sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y docker.io docker-compose-v2 nginx git fail2ban
sudo usermod -aG docker ubuntu   # usar docker sin sudo (requiere volver a entrar por SSH)
sudo systemctl enable --now fail2ban   # bloquea IPs con intentos de SSH fallidos

# Swap de 2 GB: con 1 GB de RAM, compilar la imagen puede quedarse sin memoria
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Código, variables de entorno y primer arranque

```bash
git clone https://github.com/AlejandroPedrosa/Nido-SmartHome.git
cd Nido-SmartHome && git checkout main
cd apps/backend
cp .env.example .env
nano .env        # completar con los valores reales
chmod 600 .env   # solo el usuario ubuntu puede leerlo
./deploy/deploy.sh   # construye, levanta y espera a que quede "healthy"
```

En producción:

* `CORS_ORIGIN` y `FRONTEND_URL`: la URL exacta del frontend en Vercel (por ejemplo `https://nido-smarthome.vercel.app`, sin barra final).
* `NODE_ENV` y `PORT` los fija `docker-compose.yml`.

[`deploy/deploy.sh`](deploy/deploy.sh) trae la última versión de `main`, ejecuta `docker compose up -d --build`, espera hasta 90 s a que el healthcheck marque la API como `healthy` (si no, muestra los logs y falla) y borra imágenes viejas. Verificar: `curl http://127.0.0.1:3000/health`.

### 5. Nginx y HTTPS

El frontend en Vercel se sirve por HTTPS y el navegador **bloquea** las llamadas a una API por HTTP (contenido mixto), así que HTTPS es obligatorio. La configuración de Nginx está versionada en [`deploy/nginx/nido-api.conf`](deploy/nginx/nido-api.conf). Se **copia** (no se enlaza), porque certbot edita el archivo instalado al agregar HTTPS:

```bash
cd ~/Nido-SmartHome
sudo cp apps/backend/deploy/nginx/nido-api.conf /etc/nginx/sites-available/nido-api
sudo ln -s /etc/nginx/sites-available/nido-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl http://nido-api.duckdns.org/health

sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nido-api.duckdns.org   # certificado, bloque 443 y redirección HTTP→HTTPS
curl https://nido-api.duckdns.org/health
```

Certbot instala un timer que renueva el certificado automáticamente (`sudo certbot renew --dry-run` lo prueba).

### 6. Despliegue continuo (GitHub Actions)

El workflow [`backend-deploy.yml`](../../.github/workflows/backend-deploy.yml) corre cuando **Backend CI** termina en verde por un push a `main` (o a mano desde *Actions → Backend Deploy → Run workflow*). Entra por SSH, ejecuta `deploy/deploy.sh` y después verifica `/health` por HTTPS. Solo se dispara con el archivo presente en `main`, la rama por defecto.

**Clave SSH dedicada al CD** (distinta del `.pem` personal), generada en la computadora:

```bash
ssh-keygen -t ed25519 -C "github-actions-nido" -f ~/.ssh/nido_deploy -N ""
# Autorizarla en el servidor
ssh -i nido.pem ubuntu@<ELASTIC_IP> "cat >> ~/.ssh/authorized_keys" < ~/.ssh/nido_deploy.pub
# Huella de la clave de host del servidor (para EC2_HOST_FINGERPRINT)
ssh-keyscan -t ed25519 <ELASTIC_IP> 2>/dev/null | ssh-keygen -lf - | awk '{print $2}'
```

En GitHub → *Settings → Environments* → crear **`production`** y cargar:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `EC2_HOST` | Elastic IP (o `nido-api.duckdns.org`) |
| Secret | `EC2_USER` | `ubuntu` |
| Secret | `EC2_SSH_KEY` | Contenido completo de `~/.ssh/nido_deploy` (la clave **privada**) |
| Secret | `EC2_HOST_FINGERPRINT` | La huella `SHA256:...` del comando anterior |
| Variable | `API_URL` | `https://nido-api.duckdns.org` (sin barra final) |

La clave privada solo vive en GitHub y en la computadora que la generó: no se commitea ni se comparte.

### 7. Publicar una versión

1. PR `develop → main` y merge.
2. Se ejecutan **Backend CI** y luego **Backend Deploy** (verde = API actualizada y `/health` OK) y Vercel publica el frontend.
3. Prueba de humo sobre la URL de Vercel (ver checklist del frontend).

Deploy manual, si hiciera falta: `ssh -i nido.pem ubuntu@<ELASTIC_IP> ~/Nido-SmartHome/apps/backend/deploy/deploy.sh`. Si el contenedor no levanta, `docker compose logs api` (en `apps/backend`) muestra el motivo (por ejemplo, una variable de entorno inválida o la base inaccesible).

### Checklist de producción

* [ ] Zero spend budget y alertas de capa gratuita activos en AWS.
* [ ] Elastic IP asociada y subdominio de DuckDNS apuntando a ella.
* [ ] `.env` del servidor completo, con `chmod 600` y fuera del repositorio; contraseña de la base rotada.
* [ ] Security group sin el puerto 3000 abierto; `fail2ban` activo.
* [ ] `docker compose ps` en estado `healthy`.
* [ ] HTTPS activo y `CORS_ORIGIN` / `FRONTEND_URL` con la URL exacta de Vercel.
* [ ] Environment `production` en GitHub con los secrets y la variable `API_URL`.
* [ ] En Supabase, *Authentication → URL Configuration*: **Site URL** = URL de Vercel; **Redirect URLs** = URL de Vercel con `/**` y `http://localhost:5173/**`.
