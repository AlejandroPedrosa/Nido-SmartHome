# NIDO SmartHome

## Grupo303

* Alejandro Pedrosa
* Luciano de la Rubia 
* Fancisco Lopez

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

## Funcionalidades del MVP

### Gestión de productos

* Crear, editar y eliminar productos.
* Registrar stock actual.
* Definir unidad de medida.
* Configurar stock mínimo.
* Definir presentación habitual de compra.

Ejemplo:

```text
Fideos
Stock actual: 750 g
Presentación: paquete de 500 g
Stock mínimo: 1 paquete
```

### Contenedores

Los productos podrán organizarse en diferentes espacios del hogar, por ejemplo:

* Cocina.
* Heladera.
* Freezer.
* Alacena.
* Baño.
* Lavadero.

### Control de stock

El sistema registrará entradas y salidas del inventario y detectará automáticamente productos cuyo stock esté por debajo del mínimo configurado.

### Lista de compras

NIDO SmartHome podrá generar automáticamente una lista de productos que necesitan reposición.

Ejemplo:

```text
- 1 paquete de fideos de 500 g
- 1 botella de aceite de 1 L
- 1 docena de huevos
```

### Recetas

El usuario podrá registrar recetas y relacionar sus ingredientes con los productos del inventario.

Al consumir una receta, el sistema podrá descontar automáticamente los ingredientes utilizados.

### Chatbot con Inteligencia Artificial

El asistente permitirá realizar acciones mediante lenguaje natural.

Ejemplos:

```text
¿Cuántos huevos quedan?

Compré 12 huevos y 2 litros de leche.

Usé 200 gramos de carne.

Acabo de comer un omelette.

¿Qué puedo cocinar con lo que tengo?

Generame la lista de compras.
```

La IA interpretará la solicitud y el backend será responsable de validar y ejecutar las acciones correspondientes.

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

