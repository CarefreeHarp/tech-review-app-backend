import { fn, col } from 'sequelize';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { Store } from '../models/Store.js';
import { ArticleStore } from '../models/ArticleStore.js';
import { ReviewLike } from '../models/ReviewLike.js';
import { Comment } from '../models/Comment.js';

/** Proyecta fechas como texto SQL para conservar microsegundos en los atributos canónicos del v9. */
export function timestampAttributes(alias, fields = ['created_at', 'updated_at']) {
  return { include: fields.map(field => {
    const [column, output] = Array.isArray(field) ? field : [field, field];
    return [fn('to_char', fn('timezone', 'UTC', col(alias + '.' + column)), 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), output];
  }) };
}

/** Relaciones necesarias para obtener los nombres y tiendas equivalentes al documento de producto. */
export const articleDetails = [
  { model: Category, as: 'category' },
  { model: Brand, as: 'brand' },
  { model: ArticleStore, as: 'articleStores', separate: true, include: [{ model: Store, as: 'store' }] },
];

/** Los contadores se calculan desde las relaciones SQL para evitar mantener copias inconsistentes. */
export const reviewDetails = [
  { model: ReviewLike, as: 'likes', separate: true },
  { model: Comment, as: 'comments', separate: true },
];

/** Expone los nombres de fechas v9 y conserva los nombres anteriores para los consumidores REST existentes. */
function plain(record) {
  const value = record.get ? record.get({ plain: true }) : { ...record };
  if (Object.hasOwn(value, 'createdAt') && !Object.hasOwn(value, 'created_at')) value.created_at = value.createdAt;
  if (Object.hasOwn(value, 'updatedAt') && !Object.hasOwn(value, 'updated_at')) value.updated_at = value.updatedAt;
  return value;
}

/** Devuelve el vínculo de tienda con los nombres del v9 sin sustituir sus copias almacenadas. */
export function serializeArticleStore(record) {
  const value = plain(record);
  if (value.name == null) {
    value.name = value.store?.name ?? null;
    value.website_url = value.store?.website_url ?? null;
  }
  return value;
}

/** Convierte la ficha relacional en los atributos disponibles en Firestore, con especificaciones JSON como texto. */
export function serializeArticle(record) {
  const value = plain(record);
  value.brand_name = value.brand?.name ?? null;
  value.category_name = value.category?.name ?? null;
  value.specifications = typeof value.specifications === 'string' ? value.specifications : JSON.stringify(value.specifications);
  value.stores = (value.articleStores ?? []).map(serializeArticleStore);
  value.stores_count = value.stores.length;
  delete value.articleStores;
  if (value.reviews) value.reviews = value.reviews.map(serializeReview);
  return value;
}

/** Expone los contadores de la reseña usando todos los likes y los comentarios activos, incluidas las respuestas. */
export function serializeReview(record) {
  const value = plain(record);
  value.likes_count = (value.likes ?? []).length;
  value.comments_count = (value.comments ?? []).filter(comment => comment.is_active).length;
  delete value.likes;
  delete value.comments;
  if (value.article) value.article = serializeArticle(value.article);
  return value;
}

/** Mantiene el perfil y aplica la misma representación a cada reseña asociada. */
export function serializeUser(record) {
  const value = plain(record);
  value.followers_count = (value.followers ?? []).length;
  value.follows_count = (value.following ?? []).length;
  delete value.followers;
  delete value.following;
  if (value.reviews) value.reviews = value.reviews.map(serializeReview);
  return value;
}

/** Conserva el nombre y la foto del comentario; para registros nuevos sin copia usa el perfil asociado. */
export function serializeComment(record) {
  const value = plain(record);
  value.likes_count = (value.likes ?? []).length;
  delete value.likes;
  if (value.user_username == null) {
    value.user_username = value.user?.username ?? null;
    value.user_profile_image_url = value.user?.profile_image_url ?? null;
  }
  return value;
}
