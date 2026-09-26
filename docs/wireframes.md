# NIDO SmartHome — Wireframes y Diseño de Interfaz

> **Grupo 303**: Alejandro Pedrosa, Luciano de la Rubia, Francisco Lopez  
> **Proyecto**: Trabajo Final — UTN  
> **Tipo**: Producto Mínimo Viable (MVP)

Este documento centraliza el diseño visual y la estructura de navegación de las pantallas principales del sistema, cumpliendo con los requerimientos funcionales del MVP y el diseño adaptable (RWD) establecido en RNF-06.

---

## 1. Prototipo en Figma

El diseño completo, pantallas y componentes interactivos se encuentran disponibles en el siguiente enlace:

* **Tablero Figma (Solo Lectura):** [Ver Wireframes de NIDO SmartHome en Figma]https://www.figma.com/design/CnrQJ66WcjTDhUhxjvOgYp/NIDO-SmartHome?node-id=0-1&t=lhWNENdJrb5UF4Rd-1

---

## 2. Pantallas Principales

### 2.1 Autenticación (Login / Registro)
* **Objetivo:** Permitir el ingreso seguro y el alta de nuevos usuarios mediante Supabase Auth.
* **Componentes clave:**
  * Formulario con validación de correo electrónico y contraseña.
  * Botón de acción principal ("Iniciar sesión" / "Crear cuenta").
  * Mensaje de error para credenciales inválidas (HTTP 401).
  * Enlace para alternar entre Login y Registro.

### 2.2 Dashboard (Panel Principal)
* **Objetivo:** Brindar un resumen operativo inmediato del estado del inventario hogareño al iniciar sesión.
* **Componentes clave:**
  * Tarjetas métricas: Total de productos registrados, alertas de stock bajo y recetas disponibles.
  * Tabla de stock crítico: Productos en estado "Bajo mínimo" o "Sin stock" con indicación de contenedor.
  * Acceso directo a la Lista de compras activa con avance de ítems comprados.
  * Sugerencia de recetas cocinables con existencias actuales.

### 2.3 Inventario y Productos
* **Objetivo:** Gestión integral del catálogo de productos (CRUD) y consulta de existencias.
* **Componentes clave:**
  * Buscador por nombre y filtros por categoría, contenedor físico y condición de stock bajo.
  * Tabla de productos: Nombre, categoría, contenedor, stock actual, stock mínimo, estado (`OK`, `Bajo mínimo`, `Sin stock`) y acciones.
  * Botón de acción rápida por fila para "Ajustar stock" (modal de entrada/salida manual con motivo).
  * Botón "+ Nuevo producto" para alta en modal o formulario.

### 2.4 Recetas y Cocina
* **Objetivo:** Consultar recetas, visualizar insumos requeridos y descontar stock automáticamente.
* **Componentes clave:**
  * Grilla de recetas creadas con filtro rápido de "Recetas disponibles".
  * Detalle de receta: porciones base, instrucciones e ingredientes requeridos comparados contra el stock actual.
  * Botón de acción "Cocinar receta": dispara la confirmación transaccional que valida existencias y descuenta los insumos en el inventario.

### 2.5 Lista de Compras
* **Objetivo:** Reponer existencias críticas y consolidar compras en el inventario.
* **Componentes clave:**
  * Botón "Sincronizar faltantes": consulta productos con `current_stock < min_stock` y consolida la lista activa.
  * Listado de ítems con cantidad sugerida a comprar (`suggested_quantity`) y casilla de verificación (`checkbox`) por artículo.
  * Botón "Confirmar compra": suma al stock únicamente los productos marcados como adquiridos y archiva la lista.
