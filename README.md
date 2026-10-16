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
| `make` o `make dev` | Conserva los registros y ejecuta nodemon sin reescribirlos con ejemplos. |
| `node src/index.js --seed` | Carga explícitamente los ejemplos mediante los inicializadores. No usar después de importar datos reales de Firestore. |
| `make dev-reset` | Elimina y recrea las tablas de los modelos de Sequelize, carga los ejemplos de los `init` y arranca el servidor. |

**`make dev-reset` borra los datos existentes de las tablas de la aplicación en la base configurada en `src/database/database.js`. Úsalo únicamente con una base de desarrollo.** Ejecuta `node src/index.js --reset-db` sin nodemon para que un cambio de código no vuelva a borrar los datos automáticamente. El borrado ocurre al arrancar; detener el backend no elimina registros.

El arranque normal configura las asociaciones y ejecuta `sequelize.sync({ force: false })`, sin cargar ejemplos. Los inicializadores se ejecutan en una transacción únicamente con `--seed` o `--reset-db`. Así, reiniciar Express no sustituye valores importados de Firestore por los datos de demostración. Esta sincronización crea tablas faltantes, pero **no migra las tablas del esquema anterior**: `articles.category_id` y `brand_id` ahora son enteros con claves foráneas, `specifications` es JSON y `review_likes.user_id` es obligatorio. Para probar este esquema utiliza una base de desarrollo vacía o `make dev-reset`; una base cuyos datos quieras conservar necesita una migración explícita. El arranque normal no borra tablas ni registros existentes.

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

## Datos iniciales

### Herramienta de carga del esquema Firestore anterior

`seedFirestore.js` corresponde al esquema plano previo al v9. No debe ejecutarse con `--apply` sobre la base migrada: recrearía colecciones y copias que ya se sustituyeron por subcolecciones. Se conserva para cargas del esquema anterior en un entorno separado.

#### Copiar los init a Firestore

La herramienta reutiliza los 13 inicializadores en memoria, con las validaciones de Sequelize y claves foráneas. No se conecta a PostgreSQL ni lee los registros de una base existente. Para generar una vista previa sin credenciales ni escrituras remotas:

```bash
npm run seed:firestore
```

Genera `tmp/firestore-seed.json` (ignorado por Git), con los datos, IDs de documento y campos de fecha que se completarán al crear los documentos. Es una exportación para esta herramienta, no un archivo compatible con la importación administrada de Firestore.

Para cargarlos en la base `(default)` del proyecto Devicers, utiliza una cuenta de servicio con permisos de escritura y lectura de Firestore, guardada **fuera del repositorio**:

```bash
npm run seed:firestore -- --apply --project devicers-d04dd --credentials /ruta/privada/cuenta-servicio.json
```

También admite Application Default Credentials o `GOOGLE_APPLICATION_CREDENTIALS`. La clave privada nunca se incluye en el JSON exportado. Configuración oficial: https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments

Las colecciones conservan los nombres de los modelos (`users`, `articles`, `reviews`, `comments`, `categories`, `brands`, `stores`, `review_likes`, `comment_likes`, `follows`, `review_bookmarks`, `notifications`). No se exporta `article_stores`: cada artículo contiene un array `stores` con los campos `store_id`, `store_name`, `store_website_url` y `product_url` de sus tiendas. Los documentos usan el ID numérico convertido a texto; las claves compuestas se unen con `_`, por ejemplo `follows/1_2`. Los campos de referencia siguen siendo IDs numéricos. Estos IDs son deterministas para una carga nueva de los init; no representan necesariamente los IDs de una PostgreSQL que ya tenga datos.

La carga completa usa una transacción (hasta 400 documentos), genera las fechas administradas de creación/actualización y verifica después los datos persistidos. Repetirla omite documentos cuyo contenido inicial ya coincide, conservando sus fechas y campos adicionales. Si un documento destino tiene datos distintos, la transacción aborta sin sobrescribirlo ni dejar una carga parcial.

Los usuarios de ejemplo son `prueba1` a `prueba4`, con IDs de 1 a 4 y correos `prueba1@gmail.com` a `prueba4@gmail.com`. Mantienen `firebase_uid: null` y foto nula en los init: la herramienta no crea cuentas en Firebase Authentication ni modifica cuentas existentes. Las imágenes de artículos como `device_01` conservan sus nombres de recursos Android; no se suben archivos a Storage. Esta carga tampoco cambia todavía la fuente de datos de la app ni la API.

Cada inicializador devuelve los registros reutilizados o creados. Los siguientes reciben esos registros para enlazar sus IDs reales; no dependen de IDs consecutivos. `findOrCreate` permite volver a ejecutar la carga sin duplicar los ejemplos.

Orden de inserción: usuarios → categorías (raíces antes que hijas) → marcas → tiendas → artículos → reseñas → comentarios (padres antes que respuestas) → likes de reseñas → likes de comentarios → seguidores → reseñas guardadas → artículos en tiendas → notificaciones.

| Entidad | Registros de ejemplo |
|---|---:|
| Usuarios | 4 |
| Categorías | 5 |
| Marcas | 5 |
| Tiendas | 2 |
| Artículos | 3 |
| Reseñas | 6, dos por usuario |
| Comentarios | 36, incluidos 18 comentarios raíz y sus 18 respuestas |
| Likes de reseñas | 18 |
| Likes de comentarios | 42 |
| Seguidores | 2 |
| Reseñas guardadas | 2 |
| Artículos en tiendas | 2 |
| Notificaciones | 3 |

Los likes tienen autores concretos. Las parejas usuario–reseña y usuario–comentario son únicas; seguidores, guardados y artículos en tiendas tienen claves primarias compuestas. Los ejemplos se validan antes de insertarse: referencias existentes, respuestas en el mismo hilo, seguimiento entre usuarios distintos y notificaciones compatibles con sus destinatarios. Las calificaciones admiten enteros entre 1 y 5. `firebase_uid` e imágenes permanecen nulos en los ejemplos; las tiendas usan URLs ficticias de `example.com`.

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
