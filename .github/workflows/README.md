# Workflows de CI/CD — NIDO SmartHome

Esta carpeta contiene las definiciones de flujos de trabajo automatizados mediante **GitHub Actions**.

## Pipelines previstos
* **Integración Continua (CI):**
  * Linting y validación de tipos con TypeScript en `apps/frontend` y `apps/backend`.
  * Ejecución de pruebas unitarias con Jest.
  * Build de producción de la aplicación React y compilación de NestJS.
* **Despliegue Continuo (CD):**
  * Despliegue automático del frontend a Vercel al hacer push o merge en `main`.
  * Despliegue del backend a la instancia de AWS EC2 tras la aprobación del pipeline de CI.
