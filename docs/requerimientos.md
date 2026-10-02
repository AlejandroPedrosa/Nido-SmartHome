# NIDO SmartHome — Requerimientos del Sistema

> **Grupo 303**: Alejandro Pedrosa, Luciano de la Rubia, Francisco Lopez  
> **Proyecto**: Trabajo Final — UTN  
> **Tipo**: Producto Mínimo Viable (MVP)

Este documento especifica los requerimientos funcionales, no funcionales y la matriz de trazabilidad con las reglas de negocio y casos de uso del sistema.

---

## 1. Requerimientos Funcionales (RF)

| ID | Requerimiento | Descripción |
|---|---|---|
| **RF-01** | Registro de usuario | El sistema debe permitir a nuevos usuarios registrarse mediante correo electrónico y contraseña, inicializando automáticamente sus contenedores predeterminados. |
| **RF-02** | Inicio y cierre de sesión | El sistema debe permitir a los usuarios autenticarse y cerrar su sesión activa mediante credenciales válidas utilizando Supabase Auth (JWT). |
| **RF-03** | Gestión de productos (CRUD) | El sistema debe permitir crear, listar, consultar en detalle, editar y eliminar productos asociados exclusivamente al usuario autenticado, impidiendo duplicados case-insensitive y bloqueando el borrado si forman parte de recetas existentes. |
| **RF-04** | Definición de stock y umbrales | El sistema debe permitir registrar para cada producto: stock actual, stock mínimo de alerta, unidad de medida estándar y cantidad sugerida de reposición. |
| **RF-05** | Gestión de espacios/contenedores (CRUD) | El sistema debe permitir crear, listar, modificar y eliminar contenedores físicos del hogar (ej. Heladera, Alacena), validando nombres únicos por usuario. |
| **RF-06** | Asignación de productos a contenedores | El sistema debe permitir asociar y desasociar uno o más productos a uno o varios contenedores físicos (relación M:N). |
| **RF-07** | Filtrado de inventario | El sistema debe permitir listar productos filtrando por nombre, categoría, condición de stock bajo y por contenedor asignado (`GET /products?container_id=...`). |
| **RF-08** | Ajuste manual de stock y auditoría | El sistema debe permitir registrar entradas o salidas manuales de stock, generando de forma indivisible un registro de auditoría con tipo, motivo y fecha. |
| **RF-09** | Gestión de recetas (CRUD) | El sistema debe permitir registrar, listar, consultar en detalle, editar y eliminar recetas culinarias con su nombre, porciones, instrucciones y lista de al menos un ingrediente vinculado a productos del usuario. |
| **RF-10** | Detección de recetas disponibles | El sistema debe identificar y listar qué recetas pueden ser cocinadas comparando los ingredientes requeridos contra el stock disponible actual. |
| **RF-11** | Consumo de receta | El sistema debe permitir registrar la preparación de una receta, validando existencias previas bajo bloqueo pesimista y descontando en una sola transacción todos los ingredientes del inventario con auditoría. |
| **RF-12** | Generación de lista de compras | El sistema debe generar o sincronizar de forma consolidada la lista de compras activa con los productos cuyo stock actual sea menor a su stock mínimo, depurando ítems no comprados que hayan normalizado su saldo. |
| **RF-13** | Marcado de ítems de compra | El sistema debe permitir marcar o desmarcar ítems individuales dentro de la lista de compras activa como adquiridos (`purchased`). |
| **RF-14** | Confirmación de compra | El sistema debe permitir liquidar la lista de compras activa en una transacción única, sumando al stock disponible únicamente los productos marcados como comprados y archivando la lista. |

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
| **RNF-08** | Disponibilidad y Hosting | El sistema mantendrá una disponibilidad objetivo del 99% en horario de operación activa, contemplando que en capas gratuitas de despliegue (frontend en Vercel, backend en AWS EC2/Render y base de datos en Supabase Cloud) pueden suscitarse latencias iniciales de arranque en frío (*cold starts*) de hasta 15-30 segundos tras periodos de inactividad. |

---

## 3. Matriz de Trazabilidad (Requerimientos vs. Casos de Uso y Reglas)

Esta matriz certifica qué Casos de Uso (CU) y Reglas de Negocio (especificados en el documento de Módulos) implementan cada Requerimiento Funcional:

| Requerimiento Funcional | Casos de Uso asociados | Reglas de Negocio que lo implementan |
|---|---|---|
| **RF-01** (Registro y contenedores) | CU-01 | CT-02, MT-01, MT-02 |
| **RF-02** (Autenticación y sesión) | CU-02, CU-03 | AT-01, AT-02, AT-03, MT-01, MT-02 |
| **RF-03** (CRUD Productos) | CU-07 | UG-01, UN-01, UN-02, UN-03, RC-06, MT-01, MT-02, MT-03 |
| **RF-04** (Stock y umbrales) | CU-07 | RS-01, RS-02, RS-03 |
| **RF-05** (CRUD Contenedores) | CU-08 | UG-01, CT-02, CT-03, MT-01, MT-02, MT-03 |
| **RF-06** (Asignación producto-contenedor) | CU-08 | CT-01, CT-03, MT-02, MT-03 |
| **RF-07** (Filtrado de inventario) | CU-07 | RS-01, CT-01, MT-02 |
| **RF-08** (Ajuste manual y auditoría) | CU-04, CU-05, CU-06 | RS-03, RS-06, AU-01, AU-02, AU-03, AU-04, MT-02 |
| **RF-09** (CRUD Recetas) | CU-09 | UG-01, RC-01, RC-02, MT-01, MT-02, MT-03 |
| **RF-10** (Recetas disponibles) | CU-10 | RC-04, MT-02 |
| **RF-11** (Consumo de recetas) | CU-04, CU-11 | RS-03, RS-04, RC-03, RC-05, AU-01, AU-02, MT-02 |
| **RF-12** (Generación lista de compras) | CU-12 | RS-01, RS-02, LC-01, LC-02, LC-03, LC-06, MT-02 |
| **RF-13** (Marcado de compras) | CU-13 | LC-03, MT-02, MT-03 |
| **RF-14** (Confirmación de compra) | CU-04, CU-14 | RS-05, LC-03, LC-04, LC-05, AU-01, AU-02, MT-02 |