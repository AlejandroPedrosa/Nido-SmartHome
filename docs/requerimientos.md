# NIDO SmartHome — Requerimientos del Sistema

> **Grupo 303**: Alejandro Pedrosa, Luciano de la Rubia, Francisco Lopez  
> **Proyecto**: Trabajo Final — UTN  
> **Tipo**: Producto Mínimo Viable (MVP)

Este documento especifica los requerimientos funcionales, no funcionales y la matriz de trazabilidad con las reglas de negocio del sistema.

---

## 1. Requerimientos Funcionales (RF)

| ID | Requerimiento | Descripción |
|---|---|---|
| **RF-01** | Registro de usuario | El sistema debe permitir a nuevos usuarios registrarse mediante correo electrónico y contraseña, inicializando automáticamente sus contenedores predeterminados. |
| **RF-02** | Inicio y cierre de sesión | El sistema debe permitir a los usuarios autenticarse y cerrar su sesión activa mediante credenciales válidas utilizando Supabase Auth (JWT). |
| **RF-03** | Gestión de productos (CRUD) | El sistema debe permitir crear, listar, consultar en detalle, editar y eliminar productos asociados exclusivamente al usuario autenticado. |
| **RF-04** | Definición de stock y umbrales | El sistema debe permitir registrar para cada producto: stock actual, stock mínimo de alerta, unidad de medida estándar y cantidad sugerida de reposición. |
| **RF-05** | Gestión de espacios/contenedores (CRUD) | El sistema debe permitir crear, listar, modificar y eliminar contenedores físicos del hogar (ej. Heladera, Alacena). |
| **RF-06** | Asignación de productos a contenedores | El sistema debe permitir asociar y desasociar uno o más productos a uno o varios contenedores físicos (relación M:N). |
| **RF-07** | Filtrado de inventario | El sistema debe permitir listar productos filtrando por nombre, categoría, condición de stock bajo y por contenedor asignado (`GET /products?container_id=...`). |
| **RF-08** | Ajuste manual de stock y auditoría | El sistema debe permitir registrar entradas o salidas manuales de stock, generando de forma indivisible un registro de auditoría con tipo, motivo y fecha. |
| **RF-09** | Gestión de recetas (CRUD) | El sistema debe permitir registrar, editar y listar recetas con su nombre, porciones, instrucciones y lista de ingredientes vinculados a productos del usuario. |
| **RF-10** | Detección de recetas disponibles | El sistema debe identificar y listar qué recetas pueden ser cocinadas comparando los ingredientes requeridos contra el stock disponible. |
| **RF-11** | Consumo de receta | El sistema debe permitir registrar la preparación de una receta, validando existencias previas y descontando en una sola transacción todos los ingredientes del inventario con auditoría. |
| **RF-12** | Generación de lista de compras | El sistema debe generar o actualizar de forma consolidada la lista de compras activa con los productos cuyo stock actual sea menor a su stock mínimo. |
| **RF-13** | Marcado de ítems de compra | El sistema debe permitir marcar o desmarcar ítems individuales dentro de la lista de compras activa como adquiridos (`purchased`). |
| **RF-14** | Confirmación de compra | El sistema debe permitir liquidar la lista de compras activa, sumando al stock disponible únicamente los productos marcados como comprados y archivando la lista. |

---

## 2. Requerimientos No Funcionales (RNF)

| ID | Categoría | Requerimiento |
|---|---|---|
| **RNF-01** | Seguridad y Autenticación | La API debe validar tokens JWT firmados en todas las peticiones privadas; si el token es nulo o expiró, responderá con HTTP 401. |
| **RNF-02** | Aislamiento de Datos (Multi-Tenant) | El sistema debe garantizar que ningún usuario pueda consultar, modificar ni referenciar datos de otro usuario. Cualquier intento de acceso a ID ajeno responderá con HTTP 404 (ocultamiento de existencia). |
| **RNF-03** | Integridad y Atomicidad | Las operaciones que involucren múltiples escrituras (consumo de recetas, compras, creación con stock inicial) deben ejecutarse de forma atómica en transacciones de base de datos; ante un fallo, se debe aplicar rollback total. |
| **RNF-04** | No Negatividad del Inventario | El sistema bajo ninguna circunstancia permitirá que el stock de un producto alcance valores negativos (`current_stock >= 0`). |
| **RNF-05** | Rendimiento de la API | Los endpoints de consulta deben responder en menos de 300 ms en condiciones normales de red y carga. |
| **RNF-06** | Usabilidad y Responsividad | La interfaz de usuario debe ser completamente adaptable (Responsive Web Design) para su uso fluido en teléfonos móviles y navegadores de escritorio. |
| **RNF-07** | Compatibilidad | La aplicación web debe ser compatible con las últimas dos versiones estables de Chrome, Firefox, Edge y Safari. |
| **RNF-08** | Disponibilidad y Hosting | El frontend estará alojado en Vercel con integración continua, el backend en AWS EC2 y la persistencia en Supabase Cloud. |

---

## 3. Matriz de Trazabilidad (Requerimientos vs. Reglas de Negocio)

Esta matriz certifica qué reglas de negocio (especificadas en el documento de Módulos) implementan cada Requerimiento Funcional:

| Requerimiento Funcional | Reglas de Negocio que lo implementan |
|---|---|
| **RF-01** (Registro y contenedores) | CT-02, MT-01 |
| **RF-02** (Autenticación y sesión) | MT-01, MT-02 |
| **RF-03** (CRUD Productos) | UN-01, UN-02, UN-03, MT-01, MT-02 |
| **RF-04** (Stock y umbrales) | RS-01, RS-02, RS-03 |
| **RF-05** (CRUD Contenedores) | CT-02, MT-01, MT-02 |
| **RF-06** (Asignación producto-contenedor) | CT-01, CT-03, MT-03 |
| **RF-07** (Filtrado de inventario) | RS-01, CT-01, MT-02 |
| **RF-08** (Ajuste manual y auditoría) | RS-03, RS-06, AU-01, AU-02, AU-03, AU-04 |
| **RF-09** (CRUD Recetas) | RC-01, MT-01, MT-03 |
| **RF-10** (Recetas disponibles) | RC-04 |
| **RF-11** (Consumo de recetas) | RS-03, RS-04, RC-02, RC-03, RC-05, AU-01 |
| **RF-12** (Generación lista de compras) | RS-01, RS-02, LC-01, LC-02, LC-03 |
| **RF-13** (Marcado de compras) | LC-05 |
| **RF-14** (Confirmación de compra) | RS-05, LC-04, AU-01, AU-02 |
