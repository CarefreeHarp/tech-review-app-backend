# Tech Review App Backend

API REST de reseñas de productos tecnológicos con Node.js, Express 5, Sequelize 6 y PostgreSQL. PostgreSQL conserva un diseño relacional y representa la misma información funcional que Firestore v9.

Frontend Android: [tech-review-app](https://github.com/CarefreeHarp/tech-review-app).

Diagramas SVG y sus fuentes Mermaid en el frontend: [Express / PostgreSQL](https://github.com/CarefreeHarp/tech-review-app/blob/develop/ReadMeAssets/DBdiagram.svg) · [Firestore](https://github.com/CarefreeHarp/tech-review-app/blob/develop/ReadMeAssets/FirestoreDBdiagram.svg).

## Instalación y ejecución

Requiere Node.js 18 o superior y una base PostgreSQL de desarrollo disponible.

```bash
npm ci
npm run dev
```

Configura la conexión en `src/database/database.js`. El proyecto todavía no carga un archivo `.env`. El servidor escucha en `http://localhost:3000`.

Puedes elegir el modo de arranque desde el Makefile:

| Comando | Comportamiento |
|---|---|
| `make` o `make dev` | Carga la copia incluida si todas las tablas están vacías; conserva cualquier base con datos. |
| `node src/index.js --seed` | Inserta los registros iniciales ausentes por su ID, sin sobrescribir los que ya existen. |
| `make dev-reset` | Elimina y recrea las tablas de los modelos de Sequelize, carga la copia de Firestore de los `init` y arranca el servidor. |

**`make dev-reset` borra los datos existentes de las tablas de la aplicación en la base configurada en `src/database/database.js`. Úsalo únicamente con una base de desarrollo.** Ejecuta `node src/index.js --reset-db` sin nodemon para que un cambio de código no vuelva a borrar los datos automáticamente. El borrado ocurre al arrancar; detener el backend no elimina registros.

El arranque normal configura las asociaciones y ejecuta `sequelize.sync({ force: false })`. Si las 14 tablas están vacías, ejecuta los inicializadores en una transacción. Si alguna tabla contiene registros, conserva la base tal como está. `--seed` permite añadir IDs iniciales ausentes y `--reset-db` recrea expresamente las tablas antes de cargar la copia. Reiniciar Express no restaura registros eliminados ni sustituye cambios del usuario. Esta sincronización crea tablas faltantes, pero **no migra las tablas del esquema anterior**: `articles.category_id` y `brand_id` ahora son enteros con claves foráneas, `specifications` es JSON y `review_likes.user_id` es obligatorio. Para probar este esquema utiliza una base de desarrollo vacía o `make dev-reset`; una base cuyos datos quieras conservar necesita una migración explícita. El arranque normal no borra tablas ni registros existentes.

## Estructura

```text
src/
├── app.js             # JSON y montaje de las rutas
├── index.js           # Conexión, sincronización, carga ordenada y servidor
├── controller/        # Un controller por entidad con sus consultas de lectura
├── routes/            # Rutas de cada entidad
├── models/            # 14 entidades y sus relaciones
└── database/          # Conexión y un init por entidad con sus propias validaciones
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
| ProductRequest | `/product-requests` | `/product-requests/:id` |

Una consulta con identificadores inválidos devuelve 400; un registro inexistente devuelve 404. Los usuarios incluyen sus reseñas y artículos asociados; los artículos incluyen sus reseñas y autores.

Las entidades del esquema original conservan sus rutas de lectura. `ProductRequest` también dispone de escritura, descrita más abajo. Las reseñas conservan:

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

## Solicitudes de productos y campos faltantes

`product_requests` conserva el ID textual del documento y los campos `user_id`, `product_name`, `image_url`, `category`, `brand`, `release_date`, `status` y `createdAt` (columna SQL `created_at`). No guarda `firebase_uid`. El autor debe existir en `users`; `release_date` se conserva como texto para no reinterpretar el valor del formulario.

- `GET /product-requests`, con filtro opcional `?user_id=1`.
- `GET /product-requests/:id`.
- `POST /product-requests`; requiere `user_id` y `product_name`, admite un `id` textual y los demás campos de la solicitud.
- `PUT /product-requests/:id` o `PATCH /product-requests/:id`; actualiza el contenido o estado sin cambiar el ID ni el autor.
- `DELETE /product-requests/:id`.

Los modelos `review_likes`, `comment_likes` y `review_bookmarks` incorporan `created_at`, con fecha automática para nuevas relaciones. Para los 56 registros de prueba que no tenían fecha, el propietario autorizó completarla: la migración usa la creación original del documento Firestore o, si es posterior, la creación del usuario o entidad relacionada. No sustituye las fechas que ya existían.

Las lecturas REST exponen los atributos equivalentes al v9:

- `/articles` y `/articles/:id`: `brand_name`, `category_name`, `stores`, `stores_count` y `specifications` como string JSON; PostgreSQL conserva las especificaciones como JSON y permite distintas propiedades por producto.
- `/reviews`, sus detalles y las reseñas asociadas a usuarios/artículos: `likes_count` y `comments_count`. SQL calcula estos valores desde las relaciones; `comments_count` incluye los comentarios activos y sus respuestas.
- `/comments`: `user_username` y `user_profile_image_url`. Las columnas conservan exactamente las copias que sí forman parte del documento de comentario v9.
- `/article-stores`: `name`, `website_url`, `store_id` y `product_url`, conservando los valores del vínculo del artículo.
- Los perfiles, productos, reseñas y comentarios exponen `created_at`/`updated_at` y mantienen los nombres anteriores `createdAt`/`updatedAt` para los consumidores REST existentes. Las fechas canónicas de las lecturas principales se devuelven como ISO UTC con seis dígitos decimales, conservando microsegundos; esto también se aplica a likes, seguimientos, guardados, notificaciones y solicitudes.

SQL mantiene `brands`, claves foráneas y tablas de relaciones; Firestore guarda nombres de marca en artículos y usa subcolecciones. No es necesario que ambas estructuras sean idénticas para devolver la misma información.

## Migración de Firestore v9 a ambas bases existentes

Firestore es la fuente principal para esta importación. `scripts/migrateFirestoreV9.js` lee la base `(default)` de `devicers-d04dd`, construye el destino v9 y actualiza PostgreSQL con los mismos datos útiles. No modifica el proyecto Android ni establece sincronización continua entre las bases.

Primero genera un plan y respaldos, sin escribir en ninguna base:

```bash
node scripts/migrateFirestoreV9.js --dry-run --service-account /ruta/privada/cuenta-servicio.json --backup-dir tmp/migration-v9/preflight
```

Para aplicar la migración autorizada, usa un directorio nuevo:

```bash
node scripts/migrateFirestoreV9.js --apply --service-account /ruta/privada/cuenta-servicio.json --backup-dir tmp/migration-v9/applied
```

Los modos `--dry-run`, `--apply` y `--verify` son mutuamente excluyentes. La aplicación crea un respaldo Firestore que conserva sus tipos y precisión, un `pg_dump`, un plan y una copia textual de SQL; todos quedan en el directorio privado ignorado por Git. No se guardan credenciales en esos archivos.

`--apply` usa una transacción PostgreSQL, verifica cada fila, comprueba que Firestore no cambió desde el respaldo y reemplaza sus rutas en una sola transacción. Comprueba nuevamente el destino antes de confirmar SQL; si falla SQL después de escribir Firestore, intenta restaurar el respaldo únicamente si Firestore no recibió cambios posteriores. No existe una transacción distribuida nativa entre ambas bases.

La migración SQL aditiva está en `scripts/sql/firestore-v9.sql`. Añade las fechas de likes/guardados, los campos conservados de comentarios/tiendas y `product_requests`. Las fechas existentes se importan hasta el microsegundo sin pasar por `Date` de JavaScript. Los IDs se conservan y las secuencias SQL se ajustan al máximo importado.

Firestore mueve comentarios y likes bajo las reseñas, tiendas bajo los artículos y seguimientos/guardados bajo los usuarios. Cada follow genera ambas vistas (`follows` y `followers`). Se eliminan las copias redundantes y las marcas sin productos autorizadas; la importación inicial conservó los contadores internos para evitar reutilizar IDs. Posteriormente se agruparon en `counters/next_id`, con `next_user_id` y `next_review_id`; Android actualiza cada campo sin borrar el otro. Los conteos de likes/comentarios siguen en las reseñas y el conteo de tiendas en los artículos.

La migración aplicada conserva 4 usuarios, 3 artículos, 7 reseñas, 36 comentarios, 12 likes de reseñas, 42 likes de comentarios, 2 seguimientos, 2 guardados, 2 vínculos artículo–tienda y 3 notificaciones. No había solicitudes de producto: la tabla queda preparada y vacía. Los 5 documentos de categorías y las 2 tiendas también se conservan; SQL mantiene las 3 marcas utilizadas por los productos.

Verifica ambas bases contra el plan aplicado:

```bash
node scripts/migrateFirestoreV9.js --verify --service-account /ruta/privada/cuenta-servicio.json --backup-dir tmp/migration-v9/applied
```

La herramienta se ejecuta sobre el esquema plano anterior; una segunda aplicación sobre un Firestore ya migrado se rechaza. `--verify` sí funciona sobre el resultado v9.

## Datos iniciales reproducibles

Los 14 inicializadores utilizan `src/database/data/initialData.json`, una copia de los datos de Firestore capturada el 16 de octubre de 2026 y transformada al esquema relacional. Incluye los UID de los perfiles, las biografías, URLs de fotos, IDs, estados, fechas originales y relaciones. No incluye contraseñas, tokens de sesión ni cuentas de servicio. No crea cuentas en Firebase Authentication ni copia los archivos de Storage: conserva sus URLs.

En una instalación nueva, configura una PostgreSQL vacía y ejecuta:

```bash
npm ci
make dev
```

El primer arranque crea las tablas y carga la copia automáticamente. No requiere Firebase Admin ni acceso a Firestore. La copia permanece fija: los cambios posteriores en Firebase no se descargan al arrancar.

| Tabla | Registros incluidos |
|---|---:|
| users | 4 |
| categories | 5 |
| brands | 3 |
| stores | 2 |
| articles | 3 |
| reviews | 8 |
| comments | 36 |
| review_likes | 12 |
| comment_likes | 42 |
| follows | 2 |
| review_bookmarks | 2 |
| article_stores | 2 |
| notifications | 3 |
| product_requests | 0 |

Las reseñas incluyen los registros inactivos. Las solicitudes de producto están contempladas por su inicializador, aunque no había documentos de esa colección en la captura.

Los nombres de marca de Firestore se representan mediante `brands` y `articles.brand_id` en SQL. Las subcolecciones se representan con sus tablas y claves foráneas; `follows` y `followers` generan una sola relación SQL. Los IDs adicionales que solo existen en SQL se conservan del conjunto migrado.

Los padres de categorías y comentarios se insertan antes de sus hijos. Los inicializadores validan los modelos e insertan con sus claves originales; una repetición omite los IDs existentes sin modificar sus datos. Una colisión de otra clave única se comunica como error y revierte la carga. Las fechas se envían directamente como texto SQL para conservar microsegundos. Las secuencias avanzan sin retroceder y respetan los siguientes IDs de usuarios y reseñas capturados en Firestore.

`make dev-reset` **borra** las tablas de la aplicación y vuelve a cargar esta copia. En una base que quieras conservar, utiliza el arranque normal o `node src/index.js --seed` para añadir únicamente IDs ausentes.

Se retiró el antiguo exportador `seedFirestore.js`, que cargaba el esquema documental anterior y dependía de helpers de tests eliminados. La copia actual inicializa exclusivamente PostgreSQL; las herramientas administrativas de migración permanecen separadas del servidor.

## Consultas manuales con Postman

Importa `TechReviewAppAPI.postman_collection.json` y ejecuta las peticiones sobre una base de desarrollo. Todas usan `http://localhost:3000` e IDs fijos, sin variables. Algunos ejemplos de claves compuestas son `/follows/1/2`, `/article-stores/1/1` y `/review-bookmarks/1/3`.

La eliminación de la reseña 1 está en la última carpeta porque modifica los datos de las lecturas anteriores. Para repetir la colección completa después de esa eliminación, restablece la base de pruebas: reiniciar por sí solo no garantiza que el registro recreado vuelva a tener ID 1.

### Perfiles desde Android con Retrofit

La autenticación sigue usando Firebase Auth. Android puede seleccionar Express para persistir los perfiles:

- `GET /users/by-firebase-uid/:uid`: recupera el perfil asociado al UID de registro para obtener su ID de aplicación.
- `POST /users`: crea el perfil con `firebase_uid`, `email`, `username` y `profile_image_url`; repetir el UID devuelve el existente sin sobrescribirlo.
- `PUT /users/:id`: actualiza únicamente `username`, `biography` y `profile_image_url`.

Estos endpoints operan con el ID del usuario y los campos del registro. El servidor Express no utiliza Firebase Admin, tokens Bearer ni cuentas de servicio. La clave Admin facilitada al agente se reserva exclusivamente para tareas administrativas ejecutadas por el agente; los scripts de inspección o migración son herramientas administrativas, no forman parte del arranque del servidor.

La retirada de reseñas desde Android usa `PUT /reviews/:id` con `is_active: false`, como Firestore. El endpoint DELETE existente mantiene su comportamiento para otros consumidores.

## Seguimientos y likes de comentarios

- `PUT /users/:id/follow` recibe `{ "follower_id": 1, "is_following": true }` y devuelve `is_following` y `followers_count`. El estado deseado es repetible; `false` elimina la relación y su notificación de Activity.
- `POST /reviews/:reviewId/comments/:commentId/likes/toggle` recibe `{ "user_id": 1 }` y devuelve `is_liked` y `likes_count`. El comentario debe pertenecer a esa reseña y ambos deben estar activos.

Las relaciones y las notificaciones de Activity se guardan juntas en una transacción PostgreSQL. Los likes propios no generan notificación y quitar un like o un seguimiento elimina su registro de Activity. Express no utiliza FCM, Cloud Functions ni Firestore y no envía notificaciones al teléfono. Los avisos push pertenecen exclusivamente al modo Firestore de Android.
