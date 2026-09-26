# Tech Review App Backend

Backend en desarrollo para una aplicación de reseñas de productos tecnológicos, construido con Node.js, Express, Sequelize y PostgreSQL. Utiliza módulos ES (`import` / `export`).

## Requisitos

- Node.js 18 o superior y npm.
- PostgreSQL disponible localmente o en un servidor accesible.
- Make, opcional, para ejecutar el proyecto con `make`.

## Instalación y configuración

Desde la raíz del repositorio, instala las dependencias:

```bash
npm ci
```

Configura la base de datos, el usuario y la contraseña en `src/database/database.js`. La conexión actual utiliza PostgreSQL en `localhost:5432`; la base de datos debe existir antes de iniciar el servidor.

Actualmente la configuración se encuentra directamente en ese archivo: el proyecto todavía no carga variables desde un archivo `.env`. No publiques credenciales reales en el repositorio.

## Ejecución

Inicia el servidor en desarrollo con recarga automática mediante nodemon:

```bash
make
```

El objetivo predeterminado del Makefile ejecuta el mismo comando que:

```bash
npm run dev
```

Para iniciar sin recarga automática:

```bash
node src/index.js
```

El servidor está configurado para escuchar en `http://localhost:3000`.

## Estructura

```text
src/
├── app.js                 # Aplicación Express y lectura de JSON
├── index.js               # Comprobación de conexión y arranque del servidor
├── database/
│   └── database.js        # Conexión Sequelize a PostgreSQL
└── models/
    ├── Article.js         # Modelo articles
    ├── Review.js          # Modelo reviews
    └── User.js            # Modelo users
Makefile
package.json
package-lock.json
```

## Modelos

- **Articles:** productos con nombre, modelo, descripción, imagen, fecha de lanzamiento y estado. `category_id`, `brand_id` y `specifications` son strings; categoría y marca no son claves foráneas.
- **Reviews:** reseñas con calificación, título, contenido y estado. Conserva las claves foráneas `user_id` hacia `users.id` y `article_id` hacia `articles.id`.
- **Users:** usuarios con email y username únicos, biografía, imagen de perfil, fecha de consulta de notificaciones y estado. No incluye `firebase_uid`.

Los tres modelos tienen un ID entero autoincremental y timestamps `created_at` y `updated_at` gestionados por Sequelize.
