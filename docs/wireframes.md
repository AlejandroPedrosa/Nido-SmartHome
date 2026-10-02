# NIDO SmartHome — Wireframes y Diseño de Interfaz

> **Grupo 303**: Alejandro Pedrosa, Luciano de la Rubia, Francisco Lopez  
> **Proyecto**: Trabajo Final — UTN  
> **Tipo**: Producto Mínimo Viable (MVP)

Este documento centraliza el diseño visual, la estructura de navegación y los componentes de las pantallas principales del sistema, cumpliendo con los requerimientos funcionales del MVP y el diseño adaptable (RWD) establecido en RNF-06.

---

## 1. Prototipo en Figma

El diseño completo, flujos de usuario, estados de interacción y componentes interactivos se encuentran disponibles en el siguiente enlace:

* **Tablero Figma:** [Ver Wireframes de NIDO SmartHome en Figma](https://www.figma.com/design/CnrQJ66WcjTDhUhxjvOgYp/NIDO-SmartHome?node-id=0-1&t=lhWNENJrb5UF4Rd-1)

---

## 2. Pantallas Principales y Mapeo Funcional

### 2.1 Autenticación (Login / Registro)
* **Trazabilidad:** Resuelve `RF-01`, `RF-02` | `CU-01`, `CU-02`, `CU-03`.
* **Objetivo:** Permitir el ingreso seguro y el alta de nuevos usuarios mediante Supabase Auth, inicializando los contenedores base en el registro.
* **Componentes clave:**
  * Formulario con validación en cliente de correo electrónico y contraseña.
  * Botón de acción principal ("Iniciar sesión" / "Crear cuenta").
  * Mensaje visual de alerta ante credenciales incorrectas (HTTP 401) o correo ya registrado (HTTP 409).
  * Enlace accesible para alternar entre las vistas de Login y Registro.

### 2.2 Dashboard (Panel Principal)
* **Trazabilidad:** Resuelve `RF-07`, `RF-10`, `RF-12` | `CU-07`, `CU-10`, `CU-12`.
* **Objetivo:** Brindar un resumen operativo inmediato del estado del inventario hogareño al iniciar sesión.
* **Componentes clave:**
  * Tarjetas métricas superiores: Total de productos, alertas de stock bajo y recetas disponibles para cocinar.
  * `LowStockPreview`: Tabla con productos en estado "Bajo mínimo" o "Sin stock", con indicador de contenedor asignado y acceso directo a reposición.
  * `ActiveShoppingListCard`: Acceso directo a la lista de compras activa con barra de progreso de ítems marcados/comprados.
  * `AvailableRecipesPreview`: Accesos rápidos a recetas preparables de inmediato con el stock actual.
  * Estados vacíos (*Empty states*): Ilustración y mensaje motivacional cuando no hay alertas críticas ("Inventario al día").

### 2.3 Inventario y Productos
* **Trazabilidad:** Resuelve `RF-03`, `RF-04`, `RF-07`, `RF-08` | `CU-04`, `CU-05`, `CU-06`, `CU-07`.
* **Objetivo:** Gestión integral del catálogo de productos (CRUD), auditoría de cambios y consulta de existencias.
* **Componentes clave:**
  * Buscador por nombre en tiempo real y selectores de filtro por categoría, contenedor físico y condición de stock bajo (`current_stock < min_stock`).
  * Tabla de inventario: Columnas de Nombre, Categoría, Contenedores asignados, Stock Actual, Stock Mínimo, Unidad de medida, Badge de estado (`OK`, `Bajo mínimo`, `Sin stock`) y menú de acciones.
  * Modal `StockAdjuster`: Ajuste manual rápido de entrada (+) o salida (-) con campo de motivo descriptivo (genera movimiento `manual`).
  * Modal `ProductForm`: Creación y edición de metadatos del producto (nombre único case-insensitive, categoría, unidad, stock mínimo, reposición sugerida).
  * Panel / Modal de historial de auditoría por producto (`CU-06`), listando fecha UTC, variación con signo, tipo de movimiento y motivo.
  * Acción de eliminación con modal de confirmación y feedback de advertencia (HTTP 409) si el insumo forma parte de una receta existente (regla RC-06).

### 2.4 Espacios y Contenedores
* **Trazabilidad:** Resuelve `RF-05`, `RF-06` | `CU-08`.
* **Objetivo:** Administrar los espacios físicos de guardado del hogar y la distribución de productos en ellos.
* **Componentes clave:**
  * Grilla de tarjetas de contenedores (Cocina, Heladera, Freezer, Alacena, Baño, Lavadero) con contador de productos albergados.
  * Botón "+ Nuevo contenedor" para apertura de modal de creación con validación de nombre único.
  * Vista de detalle de contenedor: listado específico de productos asignados al espacio físico seleccionado.
  * Asignador de productos (`ProductAssigner`): selector con casillas para vincular o desvincular múltiples insumos existentes en una misma operación.
  * Acción de eliminación de contenedor: confirmación modal aclarando que la eliminación del espacio desvincula la relación pero no borra los productos del inventario (regla CT-03).

### 2.5 Recetas y Cocina
* **Trazabilidad:** Resuelve `RF-09`, `RF-10`, `RF-11` | `CU-04`, `CU-09`, `CU-10`, `CU-11`.
* **Objetivo:** Gestionar el recetario del hogar, identificar preparaciones viables y liquidar insumos de forma atómica al cocinar.
* **Componentes clave:**
  * Selector de pestañas / filtro rápido: "Todas las recetas" y "Disponibles para cocinar" (insumos cubiertos al 100%).
  * Botón "+ Nueva receta": formulario con nombre, porciones, instrucciones y selector dinámico de ingredientes propios con cantidades requeridas.
  * Tarjetas de receta: visualización de porciones base, tiempo estimado, instrucciones paso a paso e indicador comparativo visual (Stock actual vs. Requerido por ingrediente).
  * Botón de acción "Cocinar receta": abre modal de confirmación con detalle de insumos a descontar; ejecuta la transacción bajo bloqueo pesimista y muestra confirmación o error ante falta imprevista de existencias (HTTP 400).
  * Menú de gestión de receta: opciones para editar datos/ingredientes o **eliminar la receta** en cascada con diálogo de confirmación.

### 2.6 Lista de Compras
* **Trazabilidad:** Resuelve `RF-12`, `RF-13`, `RF-14` | `CU-04`, `CU-12`, `CU-13`, `CU-14`.
* **Objetivo:** Consolidar reposiciones requeridas, marcar ítems en el supermercado y sumar existencias al inventario.
* **Componentes clave:**
  * Botón "Sincronizar faltantes": regenera la lista activa incluyendo productos bajo el mínimo y depurando los no comprados que hayan recuperado stock. Si no hay faltantes, muestra banner de estado "Inventario completo".
  * Tabla / Listado de compra: casillas de verificación (`checkbox`), nombre del producto, cantidad sugerida calculada (`suggested_quantity`), unidad de medida y botón para remover ítem individual.
  * Barra de progreso superior interactiva (ej. "3 de 8 productos comprados").
  * Botón "Confirmar compra": habilitado únicamente si existe al menos un ítem marcado (`purchased = true`); abre diálogo de liquidación que acredita el stock de los productos tildados, genera las auditorías de tipo `shopping` y archiva la lista.
  * Pestaña / Vista de historial: listado de listas cerradas con fecha de liquidación e insumos comprados.