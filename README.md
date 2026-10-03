# Tech Review App Backend

API REST de reseñas de productos tecnológicos con Node.js, Express 5, Sequelize 6 y PostgreSQL. Los modelos siguen el diagrama `DBdiagram.svg` del proyecto Android; los localproviders de la app permanecen intactos.

## Instalación y ejecución

Requiere Node.js 18 o superior y una base PostgreSQL de desarrollo disponible.

```bash
npm ci
npm run dev
```

Configura la conexión en `src/database/database.js`. El proyecto todavía no carga un archivo `.env`. El servidor escucha en `http://localhost:3000`.

El arranque configura las asociaciones, ejecuta `sequelize.sync({ force: false })` e inicializa los ejemplos en una transacción. Esta sincronización crea tablas faltantes, pero **no migra las tablas del esquema anterior**: `articles.category_id` y `brand_id` ahora son enteros con claves foráneas, `specifications` es JSON y `review_likes.user_id` es obligatorio. Para probar este esquema utiliza una base de desarrollo vacía; una base existente necesita una migración explícita. El arranque no borra tablas ni registros existentes.

## Estructura

```text
src/
├── app.js             # JSON y montaje de las rutas
├── index.js           # Conexión, sincronización, carga ordenada y servidor
├── controller/        # Un controller por entidad con sus consultas de lectura
├── routes/            # Rutas de cada entidad
├── models/            # 13 entidades y sus relaciones
└── database/          # Conexión y un init por entidad con sus propias validaciones
test/                  # Pruebas de carga, restricciones y API sin PostgreSQL
TechReviewAppAPI.postman_collection.json
```

## Modelos y rutas de lectura

Cada entidad expone GET de listado y GET individual. Las entidades con clave compuesta reciben ambos identificadores; no tienen un ID artificial.

| Modelo | GET de listado | GET individual |
|---|---|---|
| User | `/users` | `/users/:id` |
| Category | `/categories` | `/categories/:id` |
| Brand | `/brands` | `/brands/:id` |
| Store | `/stores` | `/stores/:id` |
| Article | `/articles` | `/articles/:id` |
| Review | `/reviews` | `/reviews/:id` |
| Comment | `/comments` | `/comments/:id` |
| ReviewLike | `/review-likes` | `/review-likes/:id` |
| CommentLike | `/comment-likes` | `/comment-likes/:id` |
| Follow | `/follows` | `/follows/:follower_id/:followed_id` |
| ArticleStore | `/article-stores` | `/article-stores/:article_id/:store_id` |
| ReviewBookmark | `/review-bookmarks` | `/review-bookmarks/:user_id/:review_id` |
| Notification | `/notifications` | `/notifications/:id` |

Una consulta con identificadores inválidos devuelve 400; un registro inexistente devuelve 404. Los usuarios incluyen sus reseñas y artículos asociados; los artículos incluyen sus reseñas y autores.

Las entidades nuevas únicamente tienen lectura. Las reseñas conservan:

- `POST /reviews` con `userId`, `articleId`, `rating`, `title` opcional y `body` en JSON.
- `PUT /reviews/:id` para editar `rating`, `title`, `body`, `is_active`, `user_id` o `article_id`; los cambios de referencia se validan.
- `DELETE /reviews/:id` con respuesta 204. También elimina comentarios, respuestas, likes y guardados dependientes; las referencias opcionales de notificaciones quedan nulas.
- `GET /articles/:articleId/reviews` y `GET /users/:userId/reviews`.

Ejemplo de creación:

```json
{
  "userId": 1,
  "articleId": 1,
  "rating": 5,
  "title": "Buen producto",
  "body": "Buena experiencia con el producto."
}
```

## Datos iniciales

Cada inicializador devuelve los registros reutilizados o creados. Los siguientes reciben esos registros para enlazar sus IDs reales; no dependen de IDs consecutivos. `findOrCreate` permite volver a ejecutar la carga sin duplicar los ejemplos.

Orden de inserción: usuarios → categorías (raíces antes que hijas) → marcas → tiendas → artículos → reseñas → comentarios (padres antes que respuestas) → likes de reseñas → likes de comentarios → seguidores → reseñas guardadas → artículos en tiendas → notificaciones.

| Entidad | Registros de ejemplo |
|---|---:|
| Usuarios | 3 |
| Categorías | 3 |
| Marcas | 2 |
| Tiendas | 2 |
| Artículos | 3 |
| Reseñas | 6, dos por usuario |
| Comentarios | 4, incluidas dos respuestas |
| Likes de reseñas | 3 |
| Likes de comentarios | 2 |
| Seguidores | 2 |
| Reseñas guardadas | 2 |
| Artículos en tiendas | 2 |
| Notificaciones | 3 |

Los likes tienen autores concretos. Las parejas usuario–reseña y usuario–comentario son únicas; seguidores, guardados y artículos en tiendas tienen claves primarias compuestas. Los ejemplos se validan antes de insertarse: referencias existentes, respuestas en el mismo hilo, seguimiento entre usuarios distintos y notificaciones compatibles con sus destinatarios. Las calificaciones admiten enteros entre 1 y 5. `firebase_uid` e imágenes permanecen nulos en los ejemplos; las tiendas usan URLs ficticias de `example.com`.

## Pruebas y Postman

```bash
npm test
```

Las pruebas usan el runner de Node.js, los validadores de Sequelize y un servidor Express temporal con persistencia simulada. No abren una conexión con PostgreSQL. Verifican la estructura de los modelos, integridad de los ejemplos, reejecución de los init, rechazo de referencias inválidas y las 35 peticiones de la colección, incluidos sus scripts de Postman.

Importa `TechReviewAppAPI.postman_collection.json` y ejecuta las peticiones sobre una base de desarrollo recién inicializada. Todas usan `http://localhost:3000` e IDs fijos, sin variables. Algunos ejemplos de claves compuestas son `/follows/1/2`, `/article-stores/1/1` y `/review-bookmarks/1/3`.

La eliminación de la reseña 1 está en la última carpeta porque modifica los datos de las lecturas anteriores. Para repetir la colección completa después de esa eliminación, restablece la base de pruebas: reiniciar por sí solo no garantiza que el registro recreado vuelva a tener ID 1.
