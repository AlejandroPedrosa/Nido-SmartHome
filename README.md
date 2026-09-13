# NIDO SmartHome

## Grupo303

* Alejandro Pedrosa
* Luciano de la Rubia 
* Francisco Lopez

## Gestor Inteligente de Inventario del Hogar

**NIDO SmartHome** es una aplicación web para gestionar de forma inteligente el inventario de productos del hogar.

El sistema permitirá registrar productos, controlar su stock, organizarlos en diferentes espacios del hogar y establecer niveles mínimos de reposición. Además, incorporará un asistente basado en Inteligencia Artificial que permitirá interactuar con el inventario mediante lenguaje natural.

El proyecto será desarrollado inicialmente como un **Producto Mínimo Viable (MVP)**.

---

## Objetivo

Centralizar y simplificar el control de los productos disponibles dentro de un hogar.

El usuario podrá saber:

* Qué productos tiene.
* Dónde están almacenados.
* Cuánto stock queda.
* Qué productos necesitan reposición.
* Qué necesita comprar.
* Qué comidas puede preparar con el inventario disponible.

---

## Alcance del Proyecto (Scope)

### Dentro del Alcance (Funcionalidades del MVP)

**Gestión de productos y stock:**
* CRUD completo de productos (crear, editar, listar y eliminar).
* Registro y actualización de stock actual.
* Definición de unidad de medida y presentación habitual de compra.
* Configuración de stock mínimo de alerta por producto.
* Registro de entradas (compras) y salidas (consumos) de stock.

Ejemplo:

```text
Fideos
Stock actual: 750 g
Presentación: paquete de 500 g
Stock mínimo: 1 paquete
```

**Contenedores / espacios:**
* Organización lógica del inventario por sectores del hogar (Cocina, Heladera, Freezer, Alacena, Baño, Lavadero).
* Visualización y filtrado de productos según su espacio asignado.

**Lista de compras automática:**
* Generación dinámica de la lista de reposición basada en productos cuyo stock esté por debajo del mínimo establecido.

Ejemplo:

```text
- 1 paquete de fideos de 500 g
- 1 botella de aceite de 1 L
- 1 docena de huevos
```

**Recetas e integración:**
* Registro de recetas, relación de ingredientes con los productos del inventario y descuento automático de insumos al registrar la preparación del plato.

**Autenticación y gestión de usuarios:**
* Registro e inicio de sesión de usuario para aislar su inventario personal.


### Fuera del Alcance (Mejoras futuras)
Para asegurar la estabilidad, el cumplimiento del cronograma y la solidez de la lógica de negocio base, las siguientes funcionalidades quedan excluidas del MVP y se definen como la hoja de ruta futura:

**Asistente virtual (Chatbot):**
* No se implementará: Interfaz conversacional para consultar stock, registrar compras/consumos o pedir sugerencias mediante lenguaje natural. (API)

* Motivo: El MVP priorizará una interfaz gráfica (UI/UX) intuitiva y rápida. Toda la gestión se realizará mediante formularios y paneles visuales antes de incorporar la capa de lenguaje natural.

**Notificaciones externas vía WhatsApp (Alertas de stock bajo):**
* No se implementará: Envío automático de mensajes o alertas por Whatsapp al usuario avisando sobre productos que están por acabarse o por debajo del stock mínimo.

* Motivo: Requiere integración y costos asociados a proveedores de mensajería y tareas programadas de despacho. En el MVP, las alertas de reposición se gestionarán exclusivamente dentro de la app mediante indicadores visuales en el panel y la lista de compras automática.

---

# Stack Tecnológico

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Zustand

## Backend

* Node.js
* NestJS
* TypeScript

## Base de Datos y Servicios

* PostgreSQL
* Supabase Database
* Supabase Auth
* Supabase Realtime
* Supabase pgvector

## Inteligencia Artificial

* OpenAI API
* Tool / Function Calling
* Embeddings para búsqueda semántica

## Infraestructura

* Vercel — Frontend
* AWS EC2 — Backend
* Supabase Cloud — Base de datos
* GitHub Actions — CI/CD

---

# Arquitectura

```text
Usuario
   │
   ▼
React + TypeScript
   │
   ▼
NestJS API
   │
   ├──────────────► OpenAI API
   │
   ▼
Supabase
PostgreSQL
Auth
Realtime
pgvector
```

---

# Repositorio

Todo el proyecto se alojará en un **único repositorio de GitHub** utilizando una estructura de monorepositorio.

```text
nido-smarthome/
│
├── apps/
│   ├── frontend/
│   └── backend/
│
├── docs/
├── .github/workflows/
└── README.md
```

Repositorio:

```text
https://github.com/AlejandroPedrosa/Nido-SmartHome
```

