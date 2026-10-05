import { ArticleStore } from "../models/ArticleStore.js";
import { Article } from "../models/Article.js";
import { Store } from "../models/Store.js";

/** Inicializa ArticleStores de ejemplo después de crear sus dependencias. */
export async function initializeArticleStores(articles, stores, options = {}) {
  const records = [];
  const data1 = { ...{ product_url: "https://tienda-a.example.com/pc-escritorio" }, ...{ article_id: articles[0].id, store_id: stores[0].id } };
  await ArticleStore.build(data1).validate();
  if (data1.article_id != null && !await Article.findByPk(data1.article_id, options)) {
    throw new Error("Invalid reference: ArticleStore.article_id");
  }
  if (data1.store_id != null && !await Store.findByPk(data1.store_id, options)) {
    throw new Error("Invalid reference: ArticleStore.store_id");
  }
  const [record1] = await ArticleStore.findOrCreate({
    where: { article_id: articles[0].id, store_id: stores[0].id },
    defaults: { product_url: "https://tienda-a.example.com/pc-escritorio" },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ product_url: "https://tienda-b.example.com/audifonos" }, ...{ article_id: articles[1].id, store_id: stores[1].id } };
  await ArticleStore.build(data2).validate();
  if (data2.article_id != null && !await Article.findByPk(data2.article_id, options)) {
    throw new Error("Invalid reference: ArticleStore.article_id");
  }
  if (data2.store_id != null && !await Store.findByPk(data2.store_id, options)) {
    throw new Error("Invalid reference: ArticleStore.store_id");
  }
  const [record2] = await ArticleStore.findOrCreate({
    where: { article_id: articles[1].id, store_id: stores[1].id },
    defaults: { product_url: "https://tienda-b.example.com/audifonos" },
    ...options,
  });
  records.push(record2);

  for (const record of records) {
    await record.validate();
    if (record.article_id != null && !await Article.findByPk(record.article_id, options)) {
      throw new Error("Invalid reference: ArticleStore.article_id");
    }
    if (record.store_id != null && !await Store.findByPk(record.store_id, options)) {
      throw new Error("Invalid reference: ArticleStore.store_id");
    }
  }
  return records;
}
