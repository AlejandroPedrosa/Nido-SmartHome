import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"])

/**
 * En builds de producción exige VITE_API_URL: sin ella, `lib/api.ts` cae en
 * `http://localhost:3000` y el deploy queda roto sin aviso. Además debe ser
 * HTTPS (el navegador bloquea llamadas HTTP desde un sitio HTTPS), salvo
 * localhost, que usa la CI.
 */
function assertProductionApiUrl(mode: string): void {
  if (mode !== "production") return

  const value = loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL?.trim()
  if (!value) {
    throw new Error(
      "VITE_API_URL es obligatoria en el build de producción (ej. https://nido-api.duckdns.org).",
    )
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`VITE_API_URL no es una URL válida: "${value}"`)
  }
  if (url.protocol !== "https:" && !LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(`VITE_API_URL debe usar https:// en producción: "${value}"`)
  }
}

export default defineConfig(({ mode }) => {
  assertProductionApiUrl(mode)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
