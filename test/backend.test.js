import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { after, before, test } from 'node:test';
import app from '../src/app.js';
import { sequelize } from '../src/database/database.js';
import { setupRelations } from '../src/models/relations.js';
import { installMemoryStore } from './support/memoryStore.js';

const order = ['Users', 'Categories', 'Brands', 'Stores', 'Articles', 'Reviews', 'Comments', 'ReviewLikes', 'CommentLikes', 'Follows', 'ReviewBookmarks', 'ArticleStores', 'Notifications'];
const initializers = Object.fromEntries(await Promise.all(order.map(async name => [name, (await import(`../src/database/init${name}.js`))[`initialize${name}`]])));
setupRelations();
const store = installMemoryStore(sequelize);
const collection = JSON.parse(await readFile(new URL('../TechReviewAppAPI.postman_collection.json', import.meta.url), 'utf8'));
let server, baseUrl;

async function seed() {
  const users = await initializers.Users();
  const categories = await initializers.Categories();
  const brands = await initializers.Brands();
  const stores = await initializers.Stores();
  const articles = await initializers.Articles(categories, brands);
  const reviews = await initializers.Reviews(users, articles);
  const comments = await initializers.Comments(users, reviews);
  const reviewLikes = await initializers.ReviewLikes(users, reviews);
  const commentLikes = await initializers.CommentLikes(users, comments);
  const follows = await initializers.Follows(users);
  const reviewBookmarks = await initializers.ReviewBookmarks(users, reviews);
  const articleStores = await initializers.ArticleStores(articles, stores);
  const notifications = await initializers.Notifications(users, reviews, comments);
  return { users, categories, brands, stores, articles, reviews, comments, reviewLikes, commentLikes, follows, reviewBookmarks, articleStores, notifications };
}

before(async () => {
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  store.restore();
  await sequelize.close();
});

test('13 entidades, claves y tipos del diagrama', () => {
  assert.equal(Object.keys(sequelize.models).length, 13);
  assert.deepEqual(sequelize.models.follows.primaryKeyAttributes, ['follower_id', 'followed_id']);
  assert.deepEqual(sequelize.models.article_stores.primaryKeyAttributes, ['article_id', 'store_id']);
  assert.deepEqual(sequelize.models.review_bookmarks.primaryKeyAttributes, ['user_id', 'review_id']);
  assert.equal(sequelize.models.articles.rawAttributes.category_id.type.key, 'INTEGER');
  assert.equal(sequelize.models.articles.rawAttributes.brand_id.type.key, 'INTEGER');
  assert.equal(sequelize.models.articles.rawAttributes.specifications.type.key, 'JSON');
  assert.ok(sequelize.models.users.rawAttributes.firebase_uid);
  for (const model of Object.values(sequelize.models)) {
    for (const attr of Object.values(model.rawAttributes)) {
      if (attr.references) assert.ok(sequelize.models[attr.references.model], attr.references.model);
    }
  }
});

test('Carga ordenada: al menos 2 registros por entidad y 2 reseñas por cada uno de 3 usuarios', async () => {
  store.reset();
  const records = await seed();
  assert.equal(records.users.length, 3);
  assert.equal(records.reviews.length, 6);
  for (const [name, rows] of store.tables) {
    assert.ok(rows.length >= 2, `${name}: ${rows.length}`);
    for (const row of rows) {
      await sequelize.models[name].build(row).validate();
      for (const [key, attr] of Object.entries(sequelize.models[name].rawAttributes)) {
        if (attr.references && row[key] != null) {
          assert.ok(store.tables.get(attr.references.model).some(target => target[attr.references.key] === row[key]), `${name}.${key}`);
        }
      }
    }
  }
  for (const user of records.users) assert.equal(records.reviews.filter(review => review.user_id === user.id).length, 2);
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.deepEqual([...source.matchAll(/await initialize(\w+)\(/g)].map(match => match[1]), order);
  assert.match(source, /sequelize\.transaction/);
  assert.doesNotMatch(source, /force:\s*true/);
});

test('Reejecutar los init no duplica registros; IDs no consecutivos conservan las relaciones', async () => {
  const counts = [...store.tables].map(([name, rows]) => [name, rows.length]);
  await seed();
  assert.deepEqual([...store.tables].map(([name, rows]) => [name, rows.length]), counts);
  store.reset(101);
  const records = await seed();
  assert.equal(records.users[0].id, 101);
  assert.equal(records.reviews[0].user_id, records.users[0].id);
  assert.equal(records.comments[1].parent_comment_id, records.comments[0].id);
  for (const [name, rows] of store.tables) {
    for (const row of rows) {
      for (const [key, attr] of Object.entries(sequelize.models[name].rawAttributes)) {
        if (attr.references && row[key] != null) assert.ok(store.tables.get(attr.references.model).some(target => target[attr.references.key] === row[key]));
      }
    }
  }
});

test('Las referencias inválidas, respuestas de otra reseña y relaciones duplicadas se rechazan', async () => {
  store.reset();
  await seed();
  const users = await sequelize.models.users.findAll();
  const reviews = await sequelize.models.reviews.findAll();
  const comments = await sequelize.models.comments.findAll();
  await assert.rejects(initializers.ReviewLikes([users[0], { id: 99999 }, users[2]], reviews), /Invalid reference/);
  await assert.rejects(initializers.Follows([users[0], users[0], users[2]]), /follow themselves/);
  const reply = store.tables.get('comments')[1];
  const originalParent = reply.parent_comment_id;
  reply.parent_comment_id = comments[2].id;
  await assert.rejects(initializers.Comments(users, reviews), /parent's review/);
  reply.parent_comment_id = originalParent;
  await assert.rejects(initializers.Notifications(users, [reviews[1], ...reviews.slice(1)], comments), /do not match/);
  await assert.rejects(sequelize.models.review_likes.create({ user_id: 2, review_id: 1 }), { name: 'SequelizeUniqueConstraintError' });
  await assert.rejects(sequelize.models.comment_likes.create({ user_id: 1, comment_id: 1 }), { name: 'SequelizeUniqueConstraintError' });
  await assert.rejects(sequelize.models.review_bookmarks.create({ user_id: 1, review_id: 3 }), { name: 'SequelizeUniqueConstraintError' });
  await assert.rejects(sequelize.models.reviews.build({ user_id: 1, article_id: 1, rating: 6, body: 'Texto', is_active: true }).validate(), { name: 'SequelizeValidationError' });
});

function runPostmanScript(item, status, response) {
  let checks = 0;
  const expect = actual => ({
    to: {
      eql(expected) { assert.deepEqual(actual, expected); },
      be: { an(type) { assert.equal(Array.isArray(actual) ? 'array' : typeof actual, type); }, at: { least(n) { assert.ok(actual >= n); } } },
    },
  });
  const pm = {
    response: { code: status, json: () => response, to: { have: { status(expected) { assert.equal(status, expected, `${item.name}: ${JSON.stringify(response)}`); } } } },
    test(_name, fn) { fn(); checks++; }, expect,
  };
  for (const event of item.event ?? []) vm.runInNewContext(event.script.exec.join('\n'), { pm });
  assert.ok(checks > 0);
}

test('Las 35 peticiones de Postman pasan por HTTP, con localhost e IDs fijos', async () => {
  store.reset();
  await seed();
  const raw = JSON.stringify(collection);
  assert.doesNotMatch(raw, /\{\{/);
  assert.equal(collection.variable, undefined);
  const requests = collection.item.flatMap(group => group.item);
  assert.equal(requests.length, 35);
  for (const item of requests) {
    const req = item.request;
    const path = '/' + req.url.path.join('/');
    assert.equal(req.url.raw, 'http://localhost:3000' + path);
    assert.equal(req.url.port, '3000');
    const response = await fetch(baseUrl + path, {
      method: req.method,
      headers: Object.fromEntries(req.header.map(header => [header.key, header.value])),
      body: req.body?.raw,
    });
    const body = response.status === 204 ? null : await response.json();
    runPostmanScript(item, response.status, body);
  }
  // La eliminación de una reseña también elimina sus comentarios, likes y guardados.
  assert.equal(await sequelize.models.reviews.findByPk(1), null);
  for (const table of ['comments', 'review_likes', 'review_bookmarks']) assert.ok(store.tables.get(table).every(row => row.review_id !== 1));
});

test('Las entidades nuevas solo exponen GET; las lecturas existentes mantienen los datos asociados', async () => {
  store.reset();
  await seed();
  for (const path of ['categories', 'brands', 'stores', 'comments', 'review-likes', 'comment-likes', 'follows', 'article-stores', 'review-bookmarks', 'notifications']) {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const response = await fetch(baseUrl + '/' + path, { method });
      assert.equal(response.status, 404, `${method} ${path}`);
    }
  }
  const user = await (await fetch(baseUrl + '/users/1')).json();
  assert.equal(user.reviews.length, 2);
  assert.ok(user.reviews.every(review => review.article.id === review.article_id));
  const article = await (await fetch(baseUrl + '/articles/1')).json();
  assert.equal(article.reviews.length, 2);
  assert.ok(article.reviews.every(review => review.user.id === review.user_id));
});

test('PUT no permite referencias inexistentes ni IDs o columnas ajenas', async () => {
  const call = body => fetch(baseUrl + '/reviews/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await call({ user_id: 999999 })).status, 404);
  assert.equal((await call({ article_id: 0 })).status, 400);
  assert.equal((await call({ body: '   ' })).status, 400);
  assert.equal((await call({ id: 25 })).status, 400);
  assert.equal((await call({ rating: 3 })).status, 200);
  assert.equal((await sequelize.models.reviews.findByPk(1)).rating, 3);
});
