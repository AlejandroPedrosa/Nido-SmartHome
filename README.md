# NIDO SmartHome

## Grupo 303

* Alejandro Pedrosa
* Luciano de la Rubia 
* Francisco Lopez

## Gestor Inteligente de Inventario del Hogar

**NIDO SmartHome** es una aplicación web diseñada para centralizar y simplificar el control de existencias y la reposición de productos del hogar.

El sistema permite registrar productos en su unidad de medida real, controlar el stock de forma atómica, organizarlos en contenedores físicos del hogar, disparar alertas visuales de reposición, generar listas de compras automáticas y gestionar recetas culinarias con descuento directo de inventario.

El proyecto se desarrolla inicialmente como un **Producto Mínimo Viable (MVP)** centrado en la robustez de la lógica de negocio, consistencia transaccional y diseño adaptable.

---

## Objetivo

Centralizar y optimizar la administración de insumos dentro del hogar.

El usuario podrá conocer en todo momento:

* Qué productos tiene registrados.
* En qué contenedor físico están almacenados.
* Cuánto stock disponible queda en la unidad correspondiente.
* Qué productos alcanzaron o perforaron el stock mínimo.
* Qué artículos necesita comprar para reponer faltantes.
* Qué recetas puede preparar de inmediato con los ingredientes disponibles.

---

## Alcance del Proyecto (Scope)

### Dentro del Alcance (Funcionalidades del MVP)

**Gestión de productos y stock:**
* CRUD completo de productos (crear, editar metadatos, listar y eliminar).
* Registro y actualización de existencias en tiempo real.
* Unidades de medida homogéneas (`g`, `kg`, `ml`, `l`, `unidad`, `paquete`, `botella`).
* Configuración de umbral de stock mínimo (`min_stock`) y cantidad sugerida de reposición (`reorder_quantity`).
* Historial inmutable de auditoría para cada entrada, salida o ajuste manual de inventario.

Ejemplo:
```text
Fideos Tallarines
Stock actual: 750 g
Stock mínimo: 500 g
Contenedor: Alacena
Estado: OK
```

**Contenedores / espacios del hogar:**
* Organización lógica del inventario por sectores físicos (Cocina, Heladera, Freezer, Alacena, Baño, Lavadero).
* Asignación flexible (muchos a muchos) y filtrado de productos por espacio asignado.

**Lista de compras automática:**
* Generación consolidada de la lista activa basada en productos con `current_stock < min_stock`.
* Cálculo de cantidad sugerida a comprar.
* Casillas de verificación para marcar artículos comprados en el supermercado.
* Confirmación y liquidación atómica: incrementa el stock únicamente de los artículos adquiridos y archiva la lista.

**Recetas y cocina:**
* Catálogo de recetas propias vinculadas a ingredientes del inventario con cantidades específicas.
* Cálculo en tiempo real de recetas disponibles para cocinar según existencias actuales.
* Preparación transaccional: descuento atómico de todos los insumos requeridos bajo control estricto de concurrencia (`FOR UPDATE`) y auditoría automática de consumo.

**Autenticación y aislamiento multi-inquilino:**
* Registro e inicio de sesión seguro mediante Supabase Auth (JWT).
* Aislamiento estricto de datos por `user_id` en todas las consultas y mutaciones.
* Protección de rutas públicas y privadas en el cliente web.

---

### Fuera del Alcance (Mejoras futuras)

Para asegurar la estabilidad, el cumplimiento del cronograma académico y la solidez de la arquitectura base, las siguientes tecnologías y funcionalidades quedan formalmente excluidas del MVP:

**Asistente conversacional con Inteligencia Artificial:**
* *No incluido en el MVP:* Integración con OpenAI API (LLMs), Tool / Function Calling y Embeddings vectoriales para consultas en lenguaje natural.
* *Justificación:* El MVP prioriza una interfaz gráfica (UI/UX) accesible, rápida y estructurada antes de incorporar interfaces conversacionales no deterministas.

**Búsqueda semántica y base de datos vectorial:**
* *No incluido en el MVP:* Extensión `pgvector` en PostgreSQL y almacenamiento de embeddings de productos o recetas.
* *Justificación:* El volumen de datos de un hogar se resuelve de manera óptima con índices relacionales B-Tree estándar y filtros estructurados por categorías y contenedores.

**Suscripciones en tiempo real:**
* *No incluido en el MVP:* Supabase Realtime (WebSockets).
* *Justificación:* La sincronización de estado cliente-servidor se gestiona eficientemente mediante clientes HTTP REST y stores reactivos con Zustand.

**Notificaciones externas push / WhatsApp:**
* *No incluido en el MVP:* Despacho automatizado de mensajes vía WhatsApp Business API o servicios externos de SMS.
* *Justificación:* Evita costos operativos y dependencias de pasarelas externas. Las alertas se visualizan en el Dashboard y en la vista de compras de la aplicación web.

---

# Stack Tecnológico (MVP)

## Frontend

* **Framework:** React 19
* **Lenguaje:** TypeScript
* **Tooling:** Vite
* **Estilos y Componentes:** Tailwind CSS, shadcn/ui, Lucide Icons
* **Gestión de Estado:** Zustand

## Backend

* **Entorno de ejecución:** Node.js
* **Framework:** NestJS
* **Lenguaje:** TypeScript
* **Conectores y Persistencia:** Cliente Supabase (Auth) y Pool de conexiones Node-Postgres (`pg`) para transacciones ACID

## Base de Datos y Autenticación

* **Motor:** PostgreSQL (vía Supabase Cloud)
* **Gestión de Identidad:** Supabase Auth (JWT y Refresh Tokens)

## Infraestructura y DevOps

* **Frontend Hosting:** Vercel
* **Backend Hosting:** AWS EC2
* **Base de datos:** Supabase Cloud
* **CI/CD:** GitHub Actions (Pipelines automatizados de linting, testing y build)

---

# Arquitectura

El sistema implementa una arquitectura desacoplada cliente-servidor comunicada mediante API REST stateless sobre HTTPS:

```text
Usuario (Navegador Web / Mobile)
       │
       ▼
React 19 + Zustand (Vercel)
       │
       │ HTTP / REST (Bearer JWT)
       ▼
NestJS API REST (AWS EC2)
       │
       ├──────────────────────────┐
       ▼                          ▼
Supabase Auth              PostgreSQL Relacional
(Validación de identidad)  (Pool pg - Transacciones ACID)
```

---

# Repositorio

El proyecto se gestiona como un monorepositorio estructurado:

```text
nido-smarthome/
├── apps/
│   ├── frontend/          # Código fuente React + Vite
│   └── backend/           # Código fuente NestJS API
├── docs/                  # Especificación de arquitectura y diseño
│   └── database/          # Script ejecutable schema.sql
├── .github/workflows/     # Automatización CI/CD
└── README.md
```

* **URL del Repositorio:** [https://github.com/AlejandroPedrosa/Nido-SmartHome](https://github.com/AlejandroPedrosa/Nido-SmartHome)

---

# Documentación

* [Requerimientos del Sistema](docs/requerimientos.md)
* [Diseño de Base de Datos](docs/base-de-datos.md)
* [Script DDL (schema.sql)](docs/database/schema.sql)
* [Módulos y Arquitectura](docs/modulos.md)
* [Wireframes y Diseño de UI](docs/wireframes.md)
