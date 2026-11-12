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
| `VITE_API_URL` | URL base del backend NestJS (sin barra final) | `http://localhost:3000` | `https://api.<tu-dominio>` |

El backend debe permitir ese origen en `CORS_ORIGIN`.

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

1. Crear un proyecto en Vercel con **Root Directory** = `apps/frontend`.
2. Framework preset: Vite.
3. Variable de entorno `VITE_API_URL` = URL HTTPS del backend (`https://api.<dominio>`).
4. El archivo [`vercel.json`](vercel.json) reescribe las rutas SPA a `/index.html` para React Router.
5. Tras el deploy, actualizar `CORS_ORIGIN` del backend con la URL de Vercel y reiniciar el contenedor en EC2.

Checklist de humo post-deploy: registro, login, CRUD de productos/contenedores/recetas, cocinar, generar lista, confirmar compra, refresh de token y logout.
