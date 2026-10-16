import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Timestamp, GeoPoint, DocumentReference } from 'firebase-admin/firestore';

/** Codifica los tipos de Firestore sin perder precisión al respaldarlos como JSON. */
export function encode(value) {
  if (value instanceof Timestamp) return { $type: 'timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
  if (value instanceof GeoPoint) return { $type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  if (value instanceof DocumentReference) return { $type: 'reference', path: value.path };
  if (Buffer.isBuffer(value)) return { $type: 'bytes', base64: value.toString('base64') };
  if (value instanceof Date) return { $type: 'date', value: value.toISOString() };
  if (typeof value === 'number' && !Number.isFinite(value)) return { $type: 'number', value: String(value) };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, encode(value[key])]));
  return value;
}

/** Restaura los tipos necesarios para escribir un respaldo sin reinterpretar sus valores. */
export function decode(value, db) {
  if (value?.$type === 'timestamp') return new Timestamp(value.seconds, value.nanoseconds);
  if (value?.$type === 'geopoint') return new GeoPoint(value.latitude, value.longitude);
  if (value?.$type === 'reference') return db.doc(value.path);
  if (value?.$type === 'bytes') return Buffer.from(value.base64, 'base64');
  if (value?.$type === 'date') return new Date(value.value);
  if (value?.$type === 'number') return Number(value.value);
  if (Array.isArray(value)) return value.map(item => decode(item, db));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item, db)]));
  return value;
}

/** Lee documentos y subcolecciones, incluidos padres inexistentes, para comprobar todo el conjunto. */
export async function captureFirestore(db, projectId) {
  const result = { formatVersion: 1, projectId, databaseId: '(default)', capturedAt: new Date().toISOString(), documents: [], missingParents: [] };
  async function visit(collection) {
    const references = await collection.listDocuments();
    for (let i = 0; i < references.length; i += 100) {
      const batch = references.slice(i, i + 100);
      if (!batch.length) continue;
      for (const doc of await db.getAll(...batch)) {
        if (doc.exists) result.documents.push({ path: doc.ref.path, data: encode(doc.data()), createTime: encode(doc.createTime), updateTime: encode(doc.updateTime) });
        else result.missingParents.push(doc.ref.path);
        for (const child of await doc.ref.listCollections()) await visit(child);
      }
    }
  }
  for (const collection of await db.listCollections()) await visit(collection);
  result.documents.sort((a, b) => a.path.localeCompare(b.path));
  return result;
}

/** Calcula una huella de los valores y rutas; excluye la fecha del propio respaldo. */
export function fingerprint(documents) {
  const values = documents.map(({ path, data }) => ({ path, data })).sort((a, b) => a.path.localeCompare(b.path));
  return createHash('sha256').update(JSON.stringify(encode(values))).digest('hex');
}

/** Conserva microsegundos al pasar fechas a PostgreSQL, sin convertirlas a Date de JavaScript. */
export function timestampText(value) {
  if (value === null) return null;
  assert.equal(value?.$type, 'timestamp', 'Fecha inesperada en el origen');
  assert.equal(value.nanoseconds % 1000, 0, 'PostgreSQL no puede conservar esta precisión de nanosegundos');
  return new Date(value.seconds * 1000).toISOString().slice(0, 19) + '.' + String(value.nanoseconds / 1000).padStart(6, '0') + 'Z';
}

const fields = {
  users: ['id', 'firebase_uid', 'email', 'username', 'biography', 'profile_image_url', 'notifications_last_viewed_at', 'is_active', 'created_at', 'updated_at'],
  articles: ['id', 'category_id', 'category_name', 'brand_name', 'name', 'model', 'description', 'image_url', 'release_date', 'specifications', 'stores_count', 'is_active', 'created_at', 'updated_at'],
  reviews: ['id', 'user_id', 'article_id', 'rating', 'title', 'body', 'likes_count', 'comments_count', 'is_active', 'created_at', 'updated_at'],
  comments: ['id', 'user_id', 'user_username', 'user_profile_image_url', 'parent_comment_id', 'body', 'is_active', 'created_at', 'updated_at'],
  categories: ['id', 'parent_category_id', 'name', 'description'],
  stores: ['id', 'name', 'website_url'],
  notifications: ['id', 'user_id', 'actor_user_id', 'type', 'review_id', 'comment_id', 'is_read', 'created_at'],
  product_requests: ['user_id', 'product_name', 'image_url', 'category', 'brand', 'release_date', 'status', 'createdAt'],
};

/** Selecciona atributos del v9; una ausencia inesperada bloquea la migración en vez de inventar datos. */
function select(data, names) {
  return Object.fromEntries(names.map(name => {
    const source = name === 'created_at' && !Object.hasOwn(data, name) ? 'createdAt' : name === 'updated_at' && !Object.hasOwn(data, name) ? 'updatedAt' : name;
    assert.ok(Object.hasOwn(data, source), `Falta ${source}`);
    return [name, data[source]];
  }));
}

/** Construye ambos destinos a partir de las entidades principales y descarta las copias redundantes autorizadas. */
export function buildPlan(snapshot) {
  assert.equal(snapshot.projectId, 'devicers-d04dd');
  assert.equal(snapshot.databaseId, '(default)');
  assert.equal(snapshot.missingParents.length, 0, 'Hay subcolecciones sin padre');
  const groups = {};
  const allowed = new Set([...Object.keys(fields), 'brands', 'review_likes', 'comment_likes', 'follows', 'review_bookmarks', 'counters', 'metadata']);
  for (const doc of snapshot.documents) {
    const [collection, id, ...nested] = doc.path.split('/');
    assert.ok(allowed.has(collection), `Colección no contemplada: ${collection}`);
    assert.equal(nested.length, 0, `El origen ya contiene subcolecciones: ${doc.path}`);
    (groups[collection] ??= []).push(doc);
    if (Object.hasOwn(doc.data, 'id')) assert.equal(String(doc.data.id), id, `ID distinto de la ruta: ${doc.path}`);
  }
  const indexed = Object.fromEntries(Object.entries(groups).map(([name, docs]) => [name, new Map(docs.map(doc => [doc.data.id, doc.data]))]));
  const lookup = (collection, id) => {
    assert.ok(indexed[collection]?.has(id), `Referencia inexistente: ${collection}/${id}`);
    return indexed[collection].get(id);
  };
  const documents = new Map();
  const tables = Object.fromEntries(['users', 'categories', 'brands', 'stores', 'articles', 'reviews', 'comments', 'review_likes', 'comment_likes', 'follows', 'article_stores', 'review_bookmarks', 'notifications', 'product_requests'].map(name => [name, []]));
  const generatedDates = [];
  function put(path, data) {
    assert.ok(!documents.has(path), `Destino duplicado: ${path}`);
    documents.set(path, encode(data));
  }
  function sqlDates(data) {
    return Object.fromEntries(Object.entries(data).map(([name, value]) => [name, value?.$type === 'timestamp' ? timestampText(value) : value]));
  }
  function actionDate(doc, related) {
    if (Object.hasOwn(doc.data, 'created_at')) return doc.data.created_at;
    if (Object.hasOwn(doc.data, 'createdAt')) return doc.data.createdAt;
    // Son datos de prueba: la fecha del documento es una referencia coherente, posterior a los participantes.
    const candidates = [doc.createTime, ...related.map(data => data.created_at ?? data.createdAt)].filter(Boolean);
    for (const date of candidates) assert.equal(date.$type, 'timestamp');
    const chosen = candidates.reduce((a, b) => a.seconds > b.seconds || (a.seconds === b.seconds && a.nanoseconds >= b.nanoseconds) ? a : b);
    generatedDates.push({ sourcePath: doc.path, created_at: chosen, basis: 'document_create_time_or_latest_related_creation' });
    return chosen;
  }
  for (const name of ['users', 'categories', 'stores', 'notifications', 'product_requests']) {
    for (const doc of groups[name] ?? []) {
      const data = select(doc.data, fields[name]);
      if (name === 'categories' && data.parent_category_id !== null) lookup('categories', data.parent_category_id);
      if (name === 'product_requests') lookup('users', data.user_id);
      if (name === 'notifications') {
        lookup('users', data.user_id); lookup('users', data.actor_user_id);
        if (data.review_id !== null) lookup('reviews', data.review_id);
        if (data.comment_id !== null) {
          const comment = lookup('comments', data.comment_id);
          if (data.review_id !== null) assert.equal(comment.review_id, data.review_id, 'Notificación con reseña y comentario incompatibles');
        }
      }
      put(doc.path, data);
      tables[name].push(sqlDates(name === 'product_requests' ? { id: doc.path.split('/')[1], ...data, created_at: data.createdAt, createdAt: undefined } : data));
      if (name === 'product_requests') delete tables[name].at(-1).createdAt;
    }
  }
  const usedBrands = new Set();
  for (const doc of groups.articles ?? []) {
    const original = doc.data;
    const category = lookup('categories', original.category_id);
    const brand = lookup('brands', original.brand_id);
    assert.equal(category.name, original.category_name, 'El nombre copiado de categoría difiere');
    assert.equal(brand.name, original.brand_name, 'El nombre copiado de marca difiere');
    assert.ok(Array.isArray(original.stores));
    const specifications = typeof original.specifications === 'string' ? original.specifications : JSON.stringify(original.specifications);
    if (typeof original.specifications !== 'string') assert.deepEqual(JSON.parse(specifications), original.specifications);
    const data = select({ ...original, specifications, stores_count: original.stores.length }, fields.articles);
    put(doc.path, data);
    usedBrands.add(original.brand_id);
    const { category_name, brand_name, stores_count, ...row } = data;
    tables.articles.push(sqlDates({ ...row, brand_id: original.brand_id, specifications: JSON.parse(specifications) }));
    for (const store of original.stores) {
      const canonical = lookup('stores', store.store_id);
      // El vínculo conserva su nombre y URL propios, aunque una tienda cambie después.
      const entry = { store_id: store.store_id, name: store.store_name, website_url: store.store_website_url, product_url: store.product_url };
      assert.ok(canonical);
      put(`${doc.path}/stores/${store.store_id}`, entry);
      tables.article_stores.push({ article_id: original.id, ...entry });
    }
  }
  tables.brands = (groups.brands ?? []).filter(doc => usedBrands.has(doc.data.id)).map(doc => select(doc.data, ['id', 'name']));
  for (const doc of groups.reviews ?? []) {
    const original = doc.data;
    lookup('users', original.user_id); lookup('articles', original.article_id);
    const likes_count = (groups.review_likes ?? []).filter(like => like.data.review_id === original.id).length;
    const comments_count = (groups.comments ?? []).filter(comment => comment.data.review_id === original.id && comment.data.is_active).length;
    const data = select({ ...original, likes_count, comments_count }, fields.reviews);
    put(doc.path, data);
    const { likes_count: _likes, comments_count: _comments, ...row } = data;
    tables.reviews.push(sqlDates(row));
  }
  for (const doc of groups.comments ?? []) {
    const original = doc.data;
    lookup('reviews', original.review_id); lookup('users', original.user_id);
    if (original.parent_comment_id !== null) {
      const visited = new Set([original.id]);
      let parentId = original.parent_comment_id;
      while (parentId !== null) {
        assert.ok(!visited.has(parentId), 'Ciclo en las respuestas de comentarios'); visited.add(parentId);
        const parent = lookup('comments', parentId);
        assert.equal(parent.review_id, original.review_id, 'Una respuesta pertenece a otra reseña');
        parentId = parent.parent_comment_id;
      }
    }
    const data = select(original, fields.comments);
    put(`reviews/${original.review_id}/comments/${original.id}`, data);
    tables.comments.push(sqlDates({ ...data, review_id: original.review_id }));
  }
  for (const name of ['review_likes', 'comment_likes']) {
    for (const doc of groups[name] ?? []) {
      const original = doc.data;
      const user = lookup('users', original.user_id);
      const target = lookup(name === 'review_likes' ? 'reviews' : 'comments', name === 'review_likes' ? original.review_id : original.comment_id);
      const data = { user_id: original.user_id, created_at: actionDate(doc, [user, target]) };
      const path = name === 'review_likes' ? `reviews/${target.id}/likes/${user.id}` : `reviews/${target.review_id}/comments/${target.id}/likes/${user.id}`;
      put(path, data);
      tables[name].push(sqlDates({ id: original.id, [name === 'review_likes' ? 'review_id' : 'comment_id']: target.id, ...data }));
    }
  }
  for (const doc of groups.follows ?? []) {
    const original = doc.data;
    const follower = lookup('users', original.follower_id), followed = lookup('users', original.followed_id);
    assert.notEqual(follower.id, followed.id, 'El usuario se sigue a sí mismo');
    const created_at = actionDate(doc, [follower, followed]);
    put(`users/${follower.id}/follows/${followed.id}`, { followed_id: followed.id, created_at });
    put(`users/${followed.id}/followers/${follower.id}`, { follower_id: follower.id, created_at });
    tables.follows.push(sqlDates({ follower_id: follower.id, followed_id: followed.id, created_at }));
  }
  for (const doc of groups.review_bookmarks ?? []) {
    const original = doc.data;
    const user = lookup('users', original.user_id), review = lookup('reviews', original.review_id);
    const data = { review_id: review.id, created_at: actionDate(doc, [user, review]) };
    put(`users/${user.id}/review_bookmarks/${review.id}`, data);
    tables.review_bookmarks.push(sqlDates({ user_id: user.id, ...data }));
  }
  // Se conservan los contadores internos existentes: eliminarlos podría reutilizar identificadores.
  for (const name of ['counters', 'metadata']) for (const doc of groups[name] ?? []) put(doc.path, doc.data);
  const result = [...documents].map(([path, data]) => ({ path, data })).sort((a, b) => a.path.localeCompare(b.path));
  const deletes = snapshot.documents.filter(doc => !documents.has(doc.path)).map(doc => doc.path);
  return { version: 9, projectId: snapshot.projectId, sourceFingerprint: fingerprint(snapshot.documents), targetFingerprint: fingerprint(result), documents: result, deletes, tables, generatedDates, removedUnusedBrands: (groups.brands ?? []).filter(doc => !usedBrands.has(doc.data.id)).map(doc => select(doc.data, ['id', 'name'])) };
}
