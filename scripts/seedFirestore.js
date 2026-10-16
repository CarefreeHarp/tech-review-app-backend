import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parseArgs } from 'node:util';
import { sequelize } from '../src/database/database.js';
import { setupRelations } from '../src/models/relations.js';
import { installMemoryStore } from '../test/support/memoryStore.js';

const initializerNames = ['Users', 'Categories', 'Brands', 'Stores', 'Articles',
  'Reviews', 'Comments', 'ReviewLikes', 'CommentLikes', 'Follows',
  'ReviewBookmarks', 'ArticleStores', 'Notifications'];
let relationsConfigured = false;

/** Ejecuta los init originales sin abrir conexiones ni modificar PostgreSQL. */
export async function collectSeedDocuments() {
  const initializers = Object.fromEntries(await Promise.all(initializerNames.map(async name =>
    [name, (await import(`../src/database/init${name}.js`))[`initialize${name}`]])));
  if (!relationsConfigured) {
    setupRelations();
    relationsConfigured = true;
  }
  // Reutiliza la persistencia en memoria que ya valida los modelos y claves foráneas en las pruebas.
  const store = installMemoryStore(sequelize);
  try {
    const users = await initializers.Users();
    const categories = await initializers.Categories();
    const brands = await initializers.Brands();
    const stores = await initializers.Stores();
    const articles = await initializers.Articles(categories, brands);
    const reviews = await initializers.Reviews(users, articles);
    const comments = await initializers.Comments(users, reviews);
    await initializers.ReviewLikes(users, reviews);
    await initializers.CommentLikes(users, comments);
    await initializers.Follows(users);
    await initializers.ReviewBookmarks(users, reviews);
    await initializers.ArticleStores(articles, stores);
    await initializers.Notifications(users, reviews, comments);

    const documents = [];
    for (const [collection, rows] of store.tables) {
      // En Firestore las tiendas se incluyen en el artículo, sin colección intermedia.
      if (collection === 'article_stores') continue;
      const model = sequelize.models[collection];
      for (const row of rows) {
        const id = model.primaryKeyAttributes.map(key => {
          if (!Number.isSafeInteger(row[key])) throw new Error(`Clave inválida: ${collection}.${key}`);
          return row[key];
        }).join('_');
        // Las fechas administradas por Sequelize se generan al crear el documento en Firestore.
        const timestampFields = Object.values(model._timestampAttributes).filter(Boolean);
        const data = structuredClone(row);
        if (collection === 'articles') {
          data.stores = (store.tables.get('article_stores') ?? [])
            .filter(relation => relation.article_id === row.id)
            .map(relation => {
              const relatedStore = store.tables.get('stores').find(item => item.id === relation.store_id);
              const embeddedStore = Object.fromEntries(Object.entries(relatedStore)
                .map(([key, value]) => [`store_${key}`, value]));
              return { ...embeddedStore, product_url: relation.product_url };
            });
        }
        documents.push({ collection, id, data, timestampFields });
      }
    }
    return documents;
  } finally {
    store.restore();
  }
}

/** Crea la carga en una transacción: reutiliza documentos idénticos y rechaza colisiones. */
export async function writeSeedDocuments(db, documents, serverTimestamp) {
  if (!documents.length || documents.length > 400) {
    throw new Error('La carga atómica admite entre 1 y 400 documentos; revisa el volumen antes de ampliarla.');
  }
  const references = documents.map(({ collection, id }) => db.collection(collection).doc(id));
  return db.runTransaction(async transaction => {
    const snapshots = await transaction.getAll(...references);
    let created = 0;
    let skipped = 0;
    for (const [index, document] of documents.entries()) {
      const snapshot = snapshots[index];
      if (snapshot.exists) {
        const existing = snapshot.data();
        const matches = Object.entries(document.data).every(([key, value]) =>
          isDeepStrictEqual(existing[key], value));
        if (!matches) throw new Error(`El documento ${document.collection}/${document.id} ya existe con otros datos. No se sobrescribió la carga.`);
        skipped++;
        continue;
      }
      const data = { ...document.data };
      for (const field of document.timestampFields) {
        if (data[field] === undefined) data[field] = serverTimestamp();
      }
      transaction.create(references[index], data);
      created++;
    }
    return { created, skipped };
  });
}

/** Exporta primero una vista previa y escribe en Firebase solo con --apply. */
async function main() {
  const { values } = parseArgs({ options: {
    project: { type: 'string' }, credentials: { type: 'string' },
    output: { type: 'string', default: 'tmp/firestore-seed.json' },
    apply: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
  } });
  if (values.help) {
    console.log('npm run seed:firestore -- [--output ruta.json] [--apply --project ID --credentials /ruta/clave.json]');
    return;
  }
  if (values.apply && !values.project) throw new Error('Indica el proyecto destino explícitamente con --project.');
  const documents = await collectSeedDocuments();
  const output = resolve(values.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ formatVersion: 1, documents }, null, 2) + '\n');
  const counts = {};
  for (const document of documents) counts[document.collection] = (counts[document.collection] ?? 0) + 1;
  console.table(counts);
  console.log(`${documents.length} documentos validados. Exportación: ${output}`);
  if (!values.apply) {
    console.log('Vista previa completada. Usa --apply --project ID para cargarlos a Firestore.');
    return;
  }

  const { initializeApp, cert, applicationDefault, deleteApp } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const credentialsPath = values.credentials ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let credential;
  if (credentialsPath) {
    const serviceAccount = JSON.parse(await readFile(resolve(credentialsPath), 'utf8'));
    if (serviceAccount.type === 'service_account') {
      if (serviceAccount.project_id !== values.project) throw new Error('La cuenta de servicio pertenece a otro proyecto.');
      credential = cert(serviceAccount);
    } else {
      if (values.credentials) throw new Error('--credentials requiere una cuenta de servicio JSON.');
      credential = applicationDefault();
    }
  } else {
    credential = applicationDefault();
  }
  const app = initializeApp({ projectId: values.project, credential }, 'firestore-seed');
  const db = getFirestore(app);
  try {
    console.log(`Destino: ${values.project}, base (default)${process.env.FIRESTORE_EMULATOR_HOST ? ' (EMULADOR)' : ''}.`);
    const result = await writeSeedDocuments(db, documents, () => FieldValue.serverTimestamp());
    // Confirma la persistencia antes de anunciar que la carga está completa.
    const snapshots = await db.getAll(...documents.map(({ collection, id }) => db.collection(collection).doc(id)));
    for (const [index, snapshot] of snapshots.entries()) {
      if (!snapshot.exists || !Object.entries(documents[index].data).every(([key, value]) =>
        isDeepStrictEqual(snapshot.data()[key], value))) {
        throw new Error(`No se pudo verificar ${documents[index].collection}/${documents[index].id}.`);
      }
    }
    console.log(`Carga verificada: ${result.created} creados, ${result.skipped} existentes e idénticos.`);
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(`Error de carga: ${error.message}`);
    process.exitCode = 1;
  }).finally(() => sequelize.close());
}
