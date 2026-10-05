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

test('Las reseñas corresponden a las imágenes y tienen dos likes y tres hilos completos', async () => {
  store.reset();
  const records = await seed();
  assert.equal(records.reviewLikes.length, 12);
  assert.equal(records.comments.length, 36);
  const commentLikeCounts = records.comments.map(comment => {
    const likes = records.commentLikes.filter(like => like.comment_id === comment.id);
    assert.ok(likes.length >= 1 && likes.length <= 2);
    assert.equal(new Set(likes.map(like => like.user_id)).size, likes.length);
    assert.ok(likes.every(like => like.user_id !== comment.user_id));
    return likes.length;
  });
  assert.equal(commentLikeCounts.filter(count => count === 1).length, 30);
  assert.equal(commentLikeCounts.filter(count => count === 2).length, 6);

  for (const review of records.reviews) {
    const article = records.articles.find(article => article.id === review.article_id);
    const topic = { device_01: /PC|torre/, device_00: /audífonos/i, device_09: /grieta.*Fortnite/i }[article.image_url];
    assert.match(review.body, topic);
    assert.match(review.title, topic);
    for (const comment of records.comments.filter(comment => comment.review_id === review.id)) {
      assert.match(comment.body, topic);
    }
    assert.ok(review.body.length >= 400);
    assert.ok(review.title.length >= 20);
    const likes = records.reviewLikes.filter(like => like.review_id === review.id);
    assert.ok(likes.length >= 2);
    assert.equal(new Set(likes.map(like => like.user_id)).size, likes.length);
    assert.ok(likes.every(like => like.user_id !== review.user_id));
    const roots = records.comments.filter(comment => comment.review_id === review.id && comment.parent_comment_id == null);
    assert.equal(roots.length, 3);
    for (const root of roots) {
      assert.ok(records.comments.some(reply => reply.review_id === review.id && reply.parent_comment_id === root.id));
    }
  }
});

test('Renovar textos antiguos conserva IDs, calificaciones, productos y relaciones sin duplicados', async () => {
  store.reset(101);
  const records = await seed();
  const legacyTitles = ['Buen sonido', 'Buena batería', 'Muy cómodos', 'Buen parlante', 'Buena cámara', 'Práctico'];
  const legacyComments = ['¿Son cómodos para usarlos varias horas?', 'Sí, los uso durante toda la jornada.', 'Gracias por compartir tu experiencia.', 'Me alegra que te haya servido.'];
  const reviewIds = records.reviews.map(review => review.id);
  const commentIds = records.comments.map(comment => comment.id);
  const articlesBefore = JSON.stringify(store.tables.get('articles'));
  const reviewsBefore = records.reviews.map(({ user_id, article_id, rating, is_active }) => ({ user_id, article_id, rating, is_active }));
  store.tables.get('reviews').forEach((row, i) => { row.title = legacyTitles[i]; row.body = 'Texto anterior.'; });
  store.tables.get('comments').slice(0, 4).forEach((row, i) => { row.body = legacyComments[i]; });
  const renewed = await seed();
  assert.deepEqual(renewed.reviews.map(review => review.id), reviewIds);
  assert.deepEqual(renewed.comments.map(comment => comment.id), commentIds);
  assert.deepEqual(renewed.reviews.map(({ user_id, article_id, rating, is_active }) => ({ user_id, article_id, rating, is_active })), reviewsBefore);
  assert.equal(JSON.stringify(store.tables.get('articles')), articlesBefore);
  assert.equal(await sequelize.models.reviews.count(), 6);
  assert.equal(await sequelize.models.comments.count(), 36);
  assert.ok(renewed.reviews.every(review => review.body.length >= 400));
  const previousTitles = [
    'Un PC de escritorio que luce tan bien como trabaja',
    'Audífonos cómodos para música y sesiones de estudio',
    'Una torre con iluminación azul para mi escritorio',
    'La grieta de Fortnite me salvó una partida',
    'Buen sonido y una diadema cómoda para el día a día',
    'Una grieta útil si eliges bien dónde aterrizar',
  ];
  store.tables.get('reviews').forEach((row, i) => { row.title = previousTitles[i]; row.body = 'Texto de la versión anterior.'; });
  store.tables.get('comments')[0].body = '¿La torre deja suficiente espacio para ordenar los cables y limpiar los ventiladores?';
  store.tables.get('comments')[1].body = 'Sí, pude acomodar los cables por el lateral y revisar el interior sin desmontar todo el equipo.';
  const upgraded = await seed();
  assert.deepEqual(upgraded.reviews.map(review => review.id), reviewIds);
  assert.deepEqual(upgraded.comments.map(comment => comment.id), commentIds);
  assert.deepEqual(upgraded.reviews.map(review => review.title), renewed.reviews.map(review => review.title));
  assert.ok(upgraded.comments.every(comment => /PC|torre|audífonos|grieta/i.test(comment.body)));
  assert.equal(await sequelize.models.reviews.count(), 6);
  assert.equal(await sequelize.models.comments.count(), 36);
  store.tables.get('reviews')[0].body = 'Contenido obsoleto con el título actual.';
  store.tables.get('comments')[0].body = upgraded.comments[0].body;
  const rerun = await seed();
  assert.deepEqual(rerun.reviews.map(review => review.id), reviewIds);
  assert.deepEqual(rerun.comments.map(comment => comment.id), commentIds);
  assert.ok(rerun.reviews.every(review => review.body.length >= 400));
});

test('Las fichas de producto corresponden a sus fotos y renuevan los datos antiguos conservando IDs', async () => {
  store.reset();
  const records = await seed();
  const expected = [
    ['device_01', 'PC de escritorio', 'Computadores', 'Personalizado'],
    ['device_00', 'Audífonos de diadema', 'Auriculares', 'Genérica'],
    ['device_09', 'Grieta de Fortnite', 'Videojuegos', 'Epic Games'],
  ];
  for (const [image, name, category, brand] of expected) {
    const article = records.articles.find(article => article.image_url === image);
    assert.equal(article.name, name);
    assert.equal(records.categories.find(item => item.id === article.category_id).name, category);
    assert.equal(records.brands.find(item => item.id === article.brand_id).name, brand);
    assert.ok(!['WH-1000XM5', 'Galaxy S24', 'SRS-XB100'].includes(article.model));
  }
  const articleIds = records.articles.map(article => article.id);
  const reviewIds = records.reviews.map(review => review.id);
  const reviewArticles = records.reviews.map(review => review.article_id);
  const legacyNames = ['Auriculares', 'Teléfono', 'Parlante portátil'];
  const legacyBrands = [records.brands[0].id, records.brands[1].id, records.brands[0].id];
  store.tables.get('articles').forEach((row, i) => {
    row.name = legacyNames[i];
    row.brand_id = legacyBrands[i];
    row.model = ['WH-1000XM5', 'Galaxy S24', 'SRS-XB100'][i];
  });
  const renewed = await seed();
  assert.deepEqual(renewed.articles.map(article => article.id), articleIds);
  assert.deepEqual(renewed.reviews.map(review => review.id), reviewIds);
  assert.deepEqual(renewed.reviews.map(review => review.article_id), reviewArticles);
  assert.deepEqual(renewed.articles.map(article => article.name), expected.map(item => item[1]));
  assert.equal(await sequelize.models.articles.count(), 3);
  assert.equal(await sequelize.models.reviews.count(), 6);
});


test('La búsqueda de perfiles excluye el ID solicitado sin afectar las lecturas generales', async () => {
  store.reset();
  await seed();
  const all = await (await fetch(baseUrl + '/users')).json();
  assert.deepEqual(all.map(user => user.id), [1, 2, 3]);
  for (const excludedId of [1, 2, 3, 999]) {
    const response = await fetch(baseUrl + '/users?excludeUserId=' + excludedId);
    assert.equal(response.status, 200);
    const users = await response.json();
    assert.deepEqual(users.map(user => user.id), all.filter(user => user.id !== excludedId).map(user => user.id));
    assert.ok(users.every(user => user.reviews.length === 2));
  }
  assert.equal((await fetch(baseUrl + '/users/1')).status, 200);
  for (const value of ['0', '-1', 'abc', '1.5', '', '9007199254740992', '1&excludeUserId=2']) {
    assert.equal((await fetch(baseUrl + '/users?excludeUserId=' + value)).status, 400, value);
  }
});
