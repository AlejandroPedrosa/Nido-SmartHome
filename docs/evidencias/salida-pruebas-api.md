# Evidencia — Pruebas de reglas críticas contra producción

> Salida de la ejecución del 2026-11-21 19:50:54 UTC contra `https://nido-api.duckdns.org`.
> Transcripción de la salida del script de pruebas, sin modificar los datos: cada petición con su código HTTP y su respuesta. No incluye tokens ni contraseñas.
>
> **Usuario A:** cuenta nueva creada solo para estas pruebas. **Usuario B:** cuenta existente del equipo, que solo intenta acceder a recursos de A.

Procedimiento y análisis de resultados con datos reales: [Pruebas de reglas críticas](../pruebas-reglas-criticas.md).

## Resumen de peticiones

| # | Sección | Paso | Petición | HTTP |
|---|---|---|---|---|
| 1 | Precondiciones | Precondición: Usuario A sin lista de compras activa | `GET /shopping/lists` | **200** |
| 2 | Precondiciones | Precondición: Usuario A sin productos bajo mínimo | `GET /products/low-stock` | **200** |
| 3 | Preparación | Crear producto con 100 g de stock | `POST /products` | **201** |
| 4 | Preparación | Crear receta que consume exactamente 100 g | `POST /recipes` | **201** |
| 5 | Caso 1 | Salida de 999 g con 100 g disponibles (esperado 400) | `POST /inventory/adjust` | **400** |
| 6 | Caso 1 | Stock después del intento (esperado 100) | `GET /products/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 7 | Caso 2 | Cocción 1 | `POST /recipes/:id/cook (en paralelo)` | **400** |
| 8 | Caso 2 | Cocción 2 | `POST /recipes/:id/cook (en paralelo)` | **200** |
| 9 | Caso 2 | Stock final (esperado 0) | `GET /products/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 10 | Caso 2 | Movimientos del producto (esperado un solo recipe_consumption de -100) | `GET /inventory/movements/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 11 | Caso 3 | Subir el mínimo a 500 g para que entre en la lista | `PATCH /products/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 12 | Caso 3 | Generar la lista de compras | `POST /shopping/lists/generate` | **200** |
| 13 | Caso 3 | Marcar el ítem como comprado | `PATCH /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/items/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 14 | Caso 3 | Confirmación 1 (esperado 200) | `POST /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/purchase` | **200** |
| 15 | Caso 3 | Confirmación 2 (esperado 409) | `POST /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/purchase` | **409** |
| 16 | Caso 3 | Stock final (esperado 500: se sumó una sola vez) | `GET /products/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 17 | Caso 3 | Movimientos (esperado un solo movimiento shopping) | `GET /inventory/movements/86678b62-899c-479b-9316-8e72d74c9532` | **200** |
| 18 | Caso 4 | B lee el producto de A (esperado 404) | `GET /products/86678b62-899c-479b-9316-8e72d74c9532` | **404** |
| 19 | Caso 4 | B ajusta el stock del producto de A (esperado 404) | `POST /inventory/adjust` | **404** |
| 20 | Caso 4 | B cocina la receta de A (esperado 404) | `POST /recipes/8885fdbd-dc50-4227-95d5-46be5b5d5eda/cook` | **404** |
| 21 | Caso 4 | B confirma la lista de A (esperado 404) | `POST /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/purchase` | **404** |
| 22 | Caso 4 | B lista sus productos (no debe aparecer "Prueba Harina 165028") | `GET /products` | **200** |
| 23 | Caso 4 | Petición sin token (esperado 401) | `GET /products` | **401** |
| 24 | Limpieza | Eliminar la receta de prueba | `DELETE /recipes/8885fdbd-dc50-4227-95d5-46be5b5d5eda` | **204** |
| 25 | Limpieza | Eliminar el producto de prueba | `DELETE /products/86678b62-899c-479b-9316-8e72d74c9532` | **204** |

## Detalle

### Precondiciones

#### 1. Precondición: Usuario A sin lista de compras activa — HTTP 200

`GET /shopping/lists`

Respuesta:

```json
[]
```


#### 2. Precondición: Usuario A sin productos bajo mínimo — HTTP 200

`GET /products/low-stock`

Respuesta:

```json
[]
```


### Preparación

#### 3. Crear producto con 100 g de stock — HTTP 201

`POST /products`

Body enviado:

```json
{"name":"Prueba Harina 165028","unit":"g","current_stock":100,"min_stock":0}
```

Respuesta:

```json
{
  "id": "86678b62-899c-479b-9316-8e72d74c9532",
  "name": "Prueba Harina 165028",
  "category": null,
  "unit": "g",
  "current_stock": 100,
  "min_stock": 0,
  "reorder_quantity": null,
  "created_at": "2026-11-21T19:50:56.674Z",
  "stock_status": "ok",
  "containers": []
}
```


#### 4. Crear receta que consume exactamente 100 g — HTTP 201

`POST /recipes`

Body enviado:

```json
{"name":"Prueba Masa 165028","servings":1,"ingredients":[{"product_id":"86678b62-899c-479b-9316-8e72d74c9532","quantity":100}]}
```

<details><summary>Respuesta</summary>

```json
{
  "id": "8885fdbd-dc50-4227-95d5-46be5b5d5eda",
  "name": "Prueba Masa 165028",
  "instructions": null,
  "servings": 1,
  "created_at": "2026-11-21T19:50:57.342Z",
  "ingredients": [
    {
      "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
      "product_name": "Prueba Harina 165028",
      "unit": "g",
      "quantity": 100,
      "current_stock": 100,
      "available": true
    }
  ],
  "can_cook": true
}
```

</details>


### Caso 1 — Stock no negativo (RS-03)

#### 5. Salida de 999 g con 100 g disponibles (esperado 400) — HTTP 400

`POST /inventory/adjust`

Body enviado:

```json
{"product_id":"86678b62-899c-479b-9316-8e72d74c9532","quantity_change":-999,"reason":"Prueba RS-03"}
```

Respuesta:

```json
{
  "message": "Stock insuficiente: disponible 100 g, se intentó descontar 999 g",
  "error": "Bad Request",
  "statusCode": 400
}
```


#### 6. Stock después del intento (esperado 100) — HTTP 200

`GET /products/86678b62-899c-479b-9316-8e72d74c9532`

Respuesta:

```json
{
  "id": "86678b62-899c-479b-9316-8e72d74c9532",
  "name": "Prueba Harina 165028",
  "category": null,
  "unit": "g",
  "current_stock": 100,
  "min_stock": 0,
  "reorder_quantity": null,
  "created_at": "2026-11-21T19:50:56.674Z",
  "containers": [],
  "stock_status": "ok"
}
```


### Caso 2 — Cocciones simultáneas (RS-04, RC-05)

_Dos POST /recipes/:id/cook lanzados en paralelo (esperado: un 200 y un 400)_

#### 7. Cocción 1 — HTTP 400

Respuesta:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Stock insuficiente para cocinar \"Prueba Masa 165028\"",
  "missing": [
    {
      "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
      "product_name": "Prueba Harina 165028",
      "unit": "g",
      "required": 100,
      "available": 0
    }
  ]
}
```


#### 8. Cocción 2 — HTTP 200

Respuesta:

```json
{
  "recipe_id": "8885fdbd-dc50-4227-95d5-46be5b5d5eda",
  "recipe_name": "Prueba Masa 165028",
  "consumed": [
    {
      "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
      "product_name": "Prueba Harina 165028",
      "unit": "g",
      "quantity": 100,
      "current_stock": 0
    }
  ]
}
```


#### 9. Stock final (esperado 0) — HTTP 200

`GET /products/86678b62-899c-479b-9316-8e72d74c9532`

Respuesta:

```json
{
  "id": "86678b62-899c-479b-9316-8e72d74c9532",
  "name": "Prueba Harina 165028",
  "category": null,
  "unit": "g",
  "current_stock": 0,
  "min_stock": 0,
  "reorder_quantity": null,
  "created_at": "2026-11-21T19:50:56.674Z",
  "containers": [],
  "stock_status": "out_of_stock"
}
```


#### 10. Movimientos del producto (esperado un solo recipe_consumption de -100) — HTTP 200

`GET /inventory/movements/86678b62-899c-479b-9316-8e72d74c9532`

<details><summary>Respuesta</summary>

```json
[
  {
    "id": "6c58bff8-3912-4419-bdfc-23ac1a3c3ddd",
    "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
    "product_name": "Prueba Harina 165028",
    "unit": "g",
    "quantity_change": -100,
    "type": "recipe_consumption",
    "reason": "Receta: Prueba Masa 165028",
    "created_at": "2026-11-21T19:50:59.225Z"
  },
  {
    "id": "d600456e-b716-4d7a-aeff-5702315116be",
    "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
    "product_name": "Prueba Harina 165028",
    "unit": "g",
    "quantity_change": 100,
    "type": "manual",
    "reason": "Stock inicial",
    "created_at": "2026-11-21T19:50:56.674Z"
  }
]
```

</details>


### Caso 3 — Compra confirmada dos veces (LC-04)

#### 11. Subir el mínimo a 500 g para que entre en la lista — HTTP 200

`PATCH /products/86678b62-899c-479b-9316-8e72d74c9532`

Body enviado:

```json
{"min_stock":500}
```

Respuesta:

```json
{
  "id": "86678b62-899c-479b-9316-8e72d74c9532",
  "name": "Prueba Harina 165028",
  "category": null,
  "unit": "g",
  "current_stock": 0,
  "min_stock": 500,
  "reorder_quantity": null,
  "created_at": "2026-11-21T19:50:56.674Z",
  "containers": [],
  "stock_status": "out_of_stock"
}
```


#### 12. Generar la lista de compras — HTTP 200

`POST /shopping/lists/generate`

<details><summary>Respuesta</summary>

```json
{
  "id": "35a87ad8-ef5f-45e1-aff0-d2bfd7419187",
  "created_at": "2026-11-21T19:51:01.837Z",
  "is_purchased": false,
  "purchased_at": null,
  "item_count": 1,
  "purchased_count": 0,
  "items": [
    {
      "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
      "product_name": "Prueba Harina 165028",
      "unit": "g",
      "suggested_quantity": 500,
      "purchased": false,
      "current_stock": 0,
      "min_stock": 500
    }
  ]
}
```

</details>


#### 13. Marcar el ítem como comprado — HTTP 200

`PATCH /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/items/86678b62-899c-479b-9316-8e72d74c9532`

Body enviado:

```json
{"purchased":true}
```

<details><summary>Respuesta</summary>

```json
{
  "id": "35a87ad8-ef5f-45e1-aff0-d2bfd7419187",
  "created_at": "2026-11-21T19:51:01.837Z",
  "is_purchased": false,
  "purchased_at": null,
  "item_count": 1,
  "purchased_count": 1,
  "items": [
    {
      "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
      "product_name": "Prueba Harina 165028",
      "unit": "g",
      "suggested_quantity": 500,
      "purchased": true,
      "current_stock": 0,
      "min_stock": 500
    }
  ]
}
```

</details>


#### 14. Confirmación 1 (esperado 200) — HTTP 200

`POST /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/purchase`

<details><summary>Respuesta</summary>

```json
{
  "id": "35a87ad8-ef5f-45e1-aff0-d2bfd7419187",
  "created_at": "2026-11-21T19:51:01.837Z",
  "is_purchased": true,
  "purchased_at": "2026-11-21T19:51:03.209Z",
  "item_count": 1,
  "purchased_count": 1,
  "items": [
    {
      "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
      "product_name": "Prueba Harina 165028",
      "unit": "g",
      "suggested_quantity": 500,
      "purchased": true,
      "current_stock": 500,
      "min_stock": 500
    }
  ]
}
```

</details>


#### 15. Confirmación 2 (esperado 409) — HTTP 409

`POST /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/purchase`

Respuesta:

```json
{
  "message": "La lista de compras ya fue confirmada",
  "error": "Conflict",
  "statusCode": 409
}
```


#### 16. Stock final (esperado 500: se sumó una sola vez) — HTTP 200

`GET /products/86678b62-899c-479b-9316-8e72d74c9532`

Respuesta:

```json
{
  "id": "86678b62-899c-479b-9316-8e72d74c9532",
  "name": "Prueba Harina 165028",
  "category": null,
  "unit": "g",
  "current_stock": 500,
  "min_stock": 500,
  "reorder_quantity": null,
  "created_at": "2026-11-21T19:50:56.674Z",
  "containers": [],
  "stock_status": "ok"
}
```


#### 17. Movimientos (esperado un solo movimiento shopping) — HTTP 200

`GET /inventory/movements/86678b62-899c-479b-9316-8e72d74c9532`

<details><summary>Respuesta</summary>

```json
[
  {
    "id": "55d0be6d-6b66-4946-b10e-d4c81ab0790a",
    "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
    "product_name": "Prueba Harina 165028",
    "unit": "g",
    "quantity_change": 500,
    "type": "shopping",
    "reason": "Compra confirmada",
    "created_at": "2026-11-21T19:51:03.209Z"
  },
  {
    "id": "6c58bff8-3912-4419-bdfc-23ac1a3c3ddd",
    "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
    "product_name": "Prueba Harina 165028",
    "unit": "g",
    "quantity_change": -100,
    "type": "recipe_consumption",
    "reason": "Receta: Prueba Masa 165028",
    "created_at": "2026-11-21T19:50:59.225Z"
  },
  {
    "id": "d600456e-b716-4d7a-aeff-5702315116be",
    "product_id": "86678b62-899c-479b-9316-8e72d74c9532",
    "product_name": "Prueba Harina 165028",
    "unit": "g",
    "quantity_change": 100,
    "type": "manual",
    "reason": "Stock inicial",
    "created_at": "2026-11-21T19:50:56.674Z"
  }
]
```

</details>


### Caso 4 — Aislamiento entre usuarios (MT-02, MT-03)

#### 18. B lee el producto de A (esperado 404) — HTTP 404

`GET /products/86678b62-899c-479b-9316-8e72d74c9532`

Respuesta:

```json
{
  "message": "Producto no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```


#### 19. B ajusta el stock del producto de A (esperado 404) — HTTP 404

`POST /inventory/adjust`

Body enviado:

```json
{"product_id":"86678b62-899c-479b-9316-8e72d74c9532","quantity_change":10}
```

Respuesta:

```json
{
  "message": "Producto no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```


#### 20. B cocina la receta de A (esperado 404) — HTTP 404

`POST /recipes/8885fdbd-dc50-4227-95d5-46be5b5d5eda/cook`

Respuesta:

```json
{
  "message": "Receta no encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```


#### 21. B confirma la lista de A (esperado 404) — HTTP 404

`POST /shopping/lists/35a87ad8-ef5f-45e1-aff0-d2bfd7419187/purchase`

Respuesta:

```json
{
  "message": "Lista de compras no encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```


#### 22. B lista sus productos (no debe aparecer "Prueba Harina 165028") — HTTP 200

`GET /products`

<details><summary>Respuesta</summary>

```json
[
  {
    "id": "8d629e6a-3974-4f7b-8a41-015c1b750185",
    "name": "Aceite",
    "category": "Alimento",
    "unit": "ml",
    "current_stock": 180,
    "min_stock": 100,
    "reorder_quantity": 500,
    "created_at": "2026-11-20T00:37:55.161Z",
    "containers": [
      {
        "id": "9fd22f60-fe22-409e-a534-174e4710d147",
        "name": "Alacena"
      }
    ],
    "stock_status": "ok"
  },
  {
    "id": "3512f005-3b68-4bc0-98c6-4a1bf3523512",
    "name": "Arroz",
    "category": "Alimento",
    "unit": "g",
    "current_stock": 0,
    "min_stock": 500,
    "reorder_quantity": 1000,
    "created_at": "2026-11-20T00:38:22.165Z",
    "containers": [
      {
        "id": "9fd22f60-fe22-409e-a534-174e4710d147",
        "name": "Alacena"
      }
    ],
    "stock_status": "out_of_stock"
  },
  {
    "id": "0138e37f-5f3b-4fb4-aefb-f1d5c1a6df1e",
    "name": "Huevos",
    "category": "Alimento",
    "unit": "unidad",
    "current_stock": 8,
    "min_stock": 4,
    "reorder_quantity": 6,
    "created_at": "2026-11-20T00:35:37.105Z",
    "containers": [
      {
        "id": "82671ff1-93ac-424a-911e-dcba58e0aa76",
        "name": "Heladera"
      }
    ],
    "stock_status": "ok"
  },
  {
    "id": "20f2c95f-f640-41c6-810b-36f63b417714",
    "name": "Leche",
    "category": "Lacteos",
    "unit": "l",
    "current_stock": 4,
    "min_stock": 3,
    "reorder_quantity": 3,
    "created_at": "2026-11-20T22:31:24.357Z",
    "containers": [
      {
        "id": "9fd22f60-fe22-409e-a534-174e4710d147",
        "name": "Alacena"
      },
      {
        "id": "82671ff1-93ac-424a-911e-dcba58e0aa76",
        "name": "Heladera"
      }
    ],
    "stock_status": "ok"
  },
  {
    "id": "744ca0c1-cf8e-490d-a0b1-3c0a368ccf2e",
    "name": "Papas",
    "category": "Verduraa",
    "unit": "g",
    "current_stock": 1400,
    "min_stock": 800,
    "reorder_quantity": 1000,
    "created_at": "2026-11-20T00:36:47.350Z",
    "containers": [
      {
        "id": "9fd22f60-fe22-409e-a534-174e4710d147",
        "name": "Alacena"
      }
    ],
    "stock_status": "ok"
  }
]
```

</details>

**RESULTADO: OK — el producto de A no aparece en el listado de B**


#### 23. Petición sin token (esperado 401) — HTTP 401

`GET /products`

Respuesta:

```json
{
  "message": "Token de acceso ausente",
  "error": "Unauthorized",
  "statusCode": 401
}
```


### Limpieza

#### 24. Eliminar la receta de prueba — HTTP 204

`DELETE /recipes/8885fdbd-dc50-4227-95d5-46be5b5d5eda`


#### 25. Eliminar el producto de prueba — HTTP 204

`DELETE /products/86678b62-899c-479b-9316-8e72d74c9532`
