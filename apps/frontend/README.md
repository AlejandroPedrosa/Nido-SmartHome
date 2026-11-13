# NIDO SmartHome — Frontend

React 19 + TypeScript + Vite + Tailwind + Zustand + axios.

## Requisitos

- Node.js 24+
- pnpm 10+

## Variables de entorno

Copiá [`.env.example`](.env.example) a `.env`:

```bash
cp .env.example .env
```

| Variable | Descripción | Local | Producción |
|----------|-------------|-------|------------|
| `VITE_API_URL` | URL base del backend NestJS (sin barra final) | `http://localhost:3000` | `https://nido-api.duckdns.org` |

El backend debe permitir el origen del frontend en `CORS_ORIGIN`.

El build de producción (`pnpm build`) **falla** si `VITE_API_URL` falta o no usa `https://` (se permite `localhost`, que usa la CI). Así un deploy sin la variable no queda apuntando en silencio a `http://localhost:3000`.

## Desarrollo

```bash
pnpm install
pnpm dev
```

La app queda en `http://localhost:5173`. El backend local se levanta desde `apps/backend` (`npm run start:dev`).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo Vite |
| `pnpm build` | Typecheck (`tsc -b`) + build de producción |
| `pnpm lint` | ESLint |
| `pnpm preview` | Sirve el build local |

## Arquitectura breve

```text
src/
  lib/api.ts          # axios + interceptores (Bearer, refresh 401)
  lib/auth-session.ts # tokens en localStorage
  services/           # un cliente por módulo del backend
  stores/             # Zustand
  pages/              # pantallas
  components/         # layout, auth, UI
```

## Despliegue en Vercel

1. En Vercel, **Add New → Project** e importar el repositorio de GitHub.
2. **Root Directory** = `apps/frontend`; **Framework preset**: Vite (build `pnpm build`, salida `dist`).
3. **Environment Variables** → `VITE_API_URL` = `https://nido-api.duckdns.org` (entorno *Production*; también *Preview* si se usan deploys de PR).
4. **Settings → Git → Production Branch** = `main`. Cada merge a `main` publica una versión; las otras ramas generan deploys de *Preview*.
5. El archivo [`vercel.json`](vercel.json) reescribe las rutas SPA a `/index.html` para React Router (por ejemplo, `/login` al volver del email de confirmación).
6. Con la URL final de Vercel (por ejemplo `https://nido-smarthome.vercel.app`):
   * En el servidor, `CORS_ORIGIN` y `FRONTEND_URL` del `.env` del backend, y volver a ejecutar `deploy/deploy.sh`.
   * En Supabase, *Authentication → URL Configuration*: **Site URL** = esa URL y **Redirect URLs** = esa URL con `/**` (además de `http://localhost:5173/**`).

Checklist de humo post-deploy (sin errores de CORS ni de contenido mixto en la consola del navegador): registro con confirmación por email (el link lleva a `/login` con "Cuenta confirmada"), login, refresh de token, CRUD de productos (con contenedores) y contenedores, recetas e indicador de stock, cocinar, generar lista, quitar un ítem, confirmar compra y logout.
