# NIDO SmartHome — Pruebas de reglas críticas

> **Grupo 303**: Alejandro Pedrosa, Luciano de la Rubia, Francisco Lopez  
> **Proyecto**: Trabajo Final — UTN  
> **Tipo**: Producto Mínimo Viable (MVP)

Este documento registra la verificación de las cuatro reglas críticas del sistema ejecutando casos reales contra la **API desplegada en producción** (`https://nido-api.duckdns.org`), que opera sobre la **base de datos real** (PostgreSQL en Supabase Cloud). Complementa las pruebas unitarias automatizadas del backend, que usan una base simulada.

| # | Regla crítica | Reglas de negocio | Dónde se garantiza |
|---|---|---|---|
| 1 | Stock no negativo | RS-03, RNF-04 | `CHECK (current_stock >= 0)` en la base y validación en `InventoryService` |
| 2 | Cocciones simultáneas | RS-04, RC-03, RC-05 | Transacción con `SELECT ... FOR UPDATE` sobre `products` en `RecipesService.cook` |
| 3 | Compra confirmada dos veces | LC-04 | `SELECT ... FOR UPDATE` sobre la cabecera de la lista en `ShoppingService.purchase` |
| 4 | Aislamiento entre usuarios | MT-01, MT-02, MT-03, RNF-02 | Filtro por `user_id` del JWT en todas las consultas y RLS sin policies |

---

## 1. Entorno y preparación

* **API:** `https://nido-api.duckdns.org`, desplegada desde `main`.
* **Base de datos:** proyecto Supabase de producción, accedido a través de la API.
* **Usuarios:** **Usuario A** es una cuenta nueva, creada desde la aplicación exclusivamente para estas pruebas y sin datos previos; es la única que crea y modifica datos. **Usuario B** es una cuenta existente del equipo que solo intenta acceder a los recursos de A, sin modificar nada propio.
* **Herramientas:** `curl` y `jq` desde una terminal.
* **Fecha de ejecución:** 2026-11-21, 19:50 UTC — **Ejecutado por:** Luciano de la Rubia
* **Salida completa de la ejecución (API):** [`evidencias/salida-pruebas-api.md`](evidencias/salida-pruebas-api.md). Registra cada petición con su código HTTP y su respuesta, sin tokens ni contraseñas. En la ejecución, los datos de prueba se crearon con un sufijo de hora para no chocar con datos existentes (`Prueba Harina 165028`, `Prueba Masa 165028`) y se eliminaron al final.

### 1.1 Obtener los tokens

```bash
API=https://nido-api.duckdns.org

TOKEN_A=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"<usuario-a>","password":"<password-a>"}' | jq -r '.access_token')

TOKEN_B=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"<usuario-b>","password":"<password-b>"}' | jq -r '.access_token')
```

### 1.2 Datos de prueba del Usuario A

```bash
# Producto con 100 g de stock
PRODUCT_ID=$(curl -s -X POST "$API/products" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prueba Harina","unit":"g","current_stock":100,"min_stock":0}' | jq -r '.id')

# Receta que consume exactamente 100 g (alcanza para una sola cocción)
RECIPE_ID=$(curl -s -X POST "$API/recipes" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Prueba Masa\",\"servings\":1,\"ingredients\":[{\"product_id\":\"$PRODUCT_ID\",\"quantity\":100}]}" | jq -r '.id')
```

---

## 2. Caso 1 — Stock no negativo (RS-03)

**Objetivo:** verificar que ninguna operación deja `current_stock < 0`.

Salida manual mayor al stock disponible:

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST "$API/inventory/adjust" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"quantity_change\":-999,\"reason\":\"Prueba RS-03\"}"
```

| Esperado | Obtenido |
|---|---|
| `HTTP 400` — `Stock insuficiente: disponible 100 g, se intentó descontar 999 g`. El stock sigue en 100 y no se registra movimiento | ✅ `HTTP 400` con el mensaje esperado. `GET /products/:id` posterior: `current_stock: 100`. El historial no registra ningún movimiento del intento |

Como segunda barrera, la base de datos rechaza cualquier escritura que deje el stock negativo, aunque no pase por la API: la columna está definida con `CHECK (current_stock >= 0)` ([`schema.sql`](database/schema.sql)), y la traducción de esa violación (`products_current_stock_check`) a `HTTP 400` está cubierta por [`pg-error.mapper.spec.ts`](../apps/backend/src/common/filters/pg-error.mapper.spec.ts).

**Evidencia:** [salida de la API](evidencias/salida-pruebas-api.md) (sección "Caso 1")

---

## 3. Caso 2 — Cocciones simultáneas (RS-04, RC-05)

**Objetivo:** verificar que dos cocciones concurrentes de una receta que solo alcanza para una vez no dejan el stock negativo ni descuentan dos veces.

Con el producto en 100 g y la receta que consume 100 g, se lanzan dos peticiones en paralelo:

```bash
for i in 1 2; do
  curl -s -o "cook-$i.json" -w "Petición $i: HTTP %{http_code}\n" \
    -X POST "$API/recipes/$RECIPE_ID/cook" -H "Authorization: Bearer $TOKEN_A" &
done
wait
cat cook-1.json cook-2.json

# Stock final y movimientos generados
curl -s "$API/products/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN_A" | jq '.current_stock'
curl -s "$API/inventory/movements/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN_A" | jq
```

| Esperado | Obtenido |
|---|---|
| Una petición `HTTP 200` y la otra `HTTP 400` con `Stock insuficiente para cocinar "Prueba Masa"` y el detalle en `missing`. Stock final `0`. Un solo movimiento `recipe_consumption` de `-100` | ✅ Cocción 2: `HTTP 200` (consumió 100 g, stock resultante 0). Cocción 1: `HTTP 400` con `missing: [{ required: 100, available: 0 }]`: esperó el bloqueo y, al leer el stock ya descontado, rechazó la operación. Stock final `0`. El historial muestra un único `recipe_consumption` de `-100` (además del `manual` de `+100` del stock inicial) |

El resultado muestra el bloqueo pesimista funcionando sobre la base real: la petición que llegó segunda quedó esperando a que la primera liberara las filas bloqueadas con `SELECT ... FOR UPDATE`, y recién entonces leyó el stock actualizado (0) y respondió 400. Sin el bloqueo, ambas podrían haber leído 100 y dado por suficiente el stock al mismo tiempo; la validación con bloqueo garantiza que solo una cocción se confirme y que la otra reciba el detalle de faltantes.

**Evidencia:** [salida de la API](evidencias/salida-pruebas-api.md) (sección "Caso 2")

---

## 4. Caso 3 — Compra confirmada dos veces (LC-04)

**Objetivo:** verificar que una lista ya confirmada no puede volver a liquidarse (el stock no se suma dos veces).

```bash
# Dejar el producto bajo mínimo y generar la lista
curl -s -X PATCH "$API/products/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -d '{"min_stock":500}' > /dev/null
LIST_ID=$(curl -s -X POST "$API/shopping/lists/generate" \
  -H "Authorization: Bearer $TOKEN_A" | jq -r '.id')

# Marcar el ítem como comprado
curl -s -X PATCH "$API/shopping/lists/$LIST_ID/items/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d '{"purchased":true}' > /dev/null

# Confirmar dos veces
for i in 1 2; do
  curl -s -w "\nConfirmación $i: HTTP %{http_code}\n" \
    -X POST "$API/shopping/lists/$LIST_ID/purchase" -H "Authorization: Bearer $TOKEN_A"
done
```

| Esperado | Obtenido |
|---|---|
| Confirmación 1: `HTTP 200`, la lista queda con `is_purchased = true`. Confirmación 2: `HTTP 409` — `La lista de compras ya fue confirmada`. El stock se incrementa una sola vez y hay un solo movimiento `shopping` | ✅ Confirmación 1: `HTTP 200`, `is_purchased: true` y stock de 0 a 500. Confirmación 2: `HTTP 409` — `La lista de compras ya fue confirmada`. Stock final `500` (se sumó una sola vez) y un único movimiento `shopping` de `+500` |

> Repetir el `for` con `&` y `wait` (como en el caso 2) prueba además la confirmación **concurrente**: el `FOR UPDATE` sobre la cabecera hace que la segunda espere y responda 409.

**Evidencia:** [salida de la API](evidencias/salida-pruebas-api.md) (sección "Caso 3")

---

## 5. Caso 4 — Aislamiento entre usuarios (MT-02, MT-03)

**Objetivo:** verificar que el Usuario B no puede ver ni modificar recursos del Usuario A, y que la respuesta no revela que existen.

```bash
# B intenta leer, ajustar, cocinar y confirmar recursos de A
curl -s -w "\nHTTP %{http_code}\n" "$API/products/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN_B"

curl -s -w "\nHTTP %{http_code}\n" -X POST "$API/inventory/adjust" \
  -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\",\"quantity_change\":10}"

curl -s -w "\nHTTP %{http_code}\n" -X POST "$API/recipes/$RECIPE_ID/cook" -H "Authorization: Bearer $TOKEN_B"

curl -s -w "\nHTTP %{http_code}\n" -X POST "$API/shopping/lists/$LIST_ID/purchase" -H "Authorization: Bearer $TOKEN_B"

# B lista sus productos: no aparece ninguno de A
curl -s "$API/products" -H "Authorization: Bearer $TOKEN_B" | jq 'map(.name)'

# Sin token
curl -s -w "\nHTTP %{http_code}\n" "$API/products"
```

| Esperado | Obtenido |
|---|---|
| Las cuatro operaciones de B sobre recursos de A responden `HTTP 404` (`Producto no encontrado`, `Receta no encontrada`, `Lista de compras no encontrada`). El listado de B no incluye "Prueba Harina". Sin token: `HTTP 401` | ✅ Las cuatro operaciones de B respondieron `HTTP 404` (`Producto no encontrado` ×2, `Receta no encontrada`, `Lista de compras no encontrada`) y no modificaron nada. `GET /products` de B devolvió solo sus propios productos, sin el de A. Sin token: `HTTP 401` — `Token de acceso ausente` |

Como defensa adicional, todas las tablas tienen Row Level Security habilitado sin policies (migración [`001_enable_rls.sql`](database/migrations/001_enable_rls.sql)), por lo que la API REST pública de Supabase no expone filas aunque se use la *Publishable key*. Ver [Base de datos § 7](base-de-datos.md#7-decisiones-de-diseño-tomadas).

**Evidencia:** [salida de la API](evidencias/salida-pruebas-api.md) (sección "Caso 4")

---

## 6. Limpieza

```bash
curl -s -X DELETE "$API/recipes/$RECIPE_ID" -H "Authorization: Bearer $TOKEN_A"
curl -s -X DELETE "$API/products/$PRODUCT_ID" -H "Authorization: Bearer $TOKEN_A"
```

---

## 7. Resumen de resultados

| # | Caso | Resultado | Códigos obtenidos |
|---|---|---|---|
| 1 | Stock no negativo | ✅ OK | 400, stock sin cambios |
| 2 | Cocciones simultáneas | ✅ OK | 200 + 400, stock final 0 |
| 3 | Compra confirmada dos veces | ✅ OK | 200 + 409, stock sumado una vez |
| 4 | Aislamiento entre usuarios | ✅ OK | 404 ×4, 401 sin token |

## 8. Pruebas unitarias relacionadas

Las mismas reglas están cubiertas por pruebas unitarias (Jest, con la base simulada) que se ejecutan en cada Pull Request:

* Stock no negativo: [`inventory.service.spec.ts`](../apps/backend/src/inventory/inventory.service.spec.ts), [`pg-error.mapper.spec.ts`](../apps/backend/src/common/filters/pg-error.mapper.spec.ts)
* Cocción atómica con bloqueo: [`recipes-cook.service.spec.ts`](../apps/backend/src/recipes/recipes-cook.service.spec.ts)
* Confirmación única de compra: [`shopping-purchase.service.spec.ts`](../apps/backend/src/shopping/shopping-purchase.service.spec.ts)
* Autenticación y aislamiento: [`supabase-auth.guard.spec.ts`](../apps/backend/src/auth/guards/supabase-auth.guard.spec.ts) y los casos de 404 por recurso ajeno en cada servicio
