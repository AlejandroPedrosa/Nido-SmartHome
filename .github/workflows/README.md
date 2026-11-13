# Workflows de CI/CD — NIDO SmartHome

Esta carpeta contiene las definiciones de flujos de trabajo automatizados mediante **GitHub Actions**.

## Workflows activos

### `backend-ci.yml` — CI del backend

| | |
|---|---|
| **Cuándo corre** | En cada pull request y push a `develop` o `main` que modifique `apps/backend/**` (o el propio workflow). También se puede lanzar a mano desde la pestaña *Actions* (`workflow_dispatch`). |
| **Node.js** | La versión de `apps/backend/.nvmrc`, con caché de dependencias de npm. |
| **Pasos** | `npm ci` → `lint` → `format:check` → `typecheck` → `test` → `build`. Cualquier paso que falle marca el PR en rojo. |
| **Secretos** | Ninguno: los tests son unitarios (con mocks) y no acceden a la base de datos ni a Supabase. |

Si un push nuevo llega mientras corre una ejecución de la misma rama, la anterior se cancela.

Para reproducirlo en local antes de abrir un PR:

```bash
cd apps/backend && npm ci && npm run check && npm run build
```

## Pipelines previstos

* **Integración Continua (CI) del frontend:** linting, tipos, tests y build de `apps/frontend`.
* **Despliegue Continuo (CD):**
  * Despliegue automático del frontend a Vercel al hacer push o merge en `main`.
  * Despliegue del backend a la instancia de AWS EC2 tras la aprobación del pipeline de CI.
