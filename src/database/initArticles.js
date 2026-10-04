import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";
import { Brand } from "../models/Brand.js";

/** Inicializa Articles de ejemplo después de crear sus dependencias. */
export async function initializeArticles(categories, brands, options = {}) {
  const records = [];
  const data1 = { ...{ category_id: categories[2].id, model: "WH-1000XM5", description: "Auriculares inalámbricos con cancelación de ruido.", image_url: "device_01", release_date: "2022-05-20", specifications: { connection: "Bluetooth", noiseCancellation: true }, is_active: true }, ...{ name: "Auriculares", brand_id: brands[0].id } };
  await Article.build(data1).validate();
  if (data1.category_id != null && !await Category.findByPk(data1.category_id, options)) {
    throw new Error("Invalid reference: Article.category_id");
  }
  if (data1.brand_id != null && !await Brand.findByPk(data1.brand_id, options)) {
    throw new Error("Invalid reference: Article.brand_id");
  }
  const [record1] = await Article.findOrCreate({
    where: { name: "Auriculares", brand_id: brands[0].id },
    defaults: { category_id: categories[2].id, model: "WH-1000XM5", description: "Auriculares inalámbricos con cancelación de ruido.", image_url: "device_01", release_date: "2022-05-20", specifications: { connection: "Bluetooth", noiseCancellation: true }, is_active: true },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ category_id: categories[1].id, model: "Galaxy S24", description: "Teléfono para fotografía y uso diario.", image_url: "device_00", release_date: "2024-01-31", specifications: { screen: "AMOLED", storageGb: 256 }, is_active: true }, ...{ name: "Teléfono", brand_id: brands[1].id } };
  await Article.build(data2).validate();
  if (data2.category_id != null && !await Category.findByPk(data2.category_id, options)) {
    throw new Error("Invalid reference: Article.category_id");
  }
  if (data2.brand_id != null && !await Brand.findByPk(data2.brand_id, options)) {
    throw new Error("Invalid reference: Article.brand_id");
  }
  const [record2] = await Article.findOrCreate({
    where: { name: "Teléfono", brand_id: brands[1].id },
    defaults: { category_id: categories[1].id, model: "Galaxy S24", description: "Teléfono para fotografía y uso diario.", image_url: "device_00", release_date: "2024-01-31", specifications: { screen: "AMOLED", storageGb: 256 }, is_active: true },
    ...options,
  });
  records.push(record2);

  const data3 = { ...{ category_id: categories[0].id, model: "SRS-XB100", description: "Parlante portátil para escuchar música.", image_url: "device_09", release_date: null, specifications: { connection: "Bluetooth", portable: true }, is_active: true }, ...{ name: "Parlante portátil", brand_id: brands[0].id } };
  await Article.build(data3).validate();
  if (data3.category_id != null && !await Category.findByPk(data3.category_id, options)) {
    throw new Error("Invalid reference: Article.category_id");
  }
  if (data3.brand_id != null && !await Brand.findByPk(data3.brand_id, options)) {
    throw new Error("Invalid reference: Article.brand_id");
  }
  const [record3] = await Article.findOrCreate({
    where: { name: "Parlante portátil", brand_id: brands[0].id },
    defaults: { category_id: categories[0].id, model: "SRS-XB100", description: "Parlante portátil para escuchar música.", image_url: "device_09", release_date: null, specifications: { connection: "Bluetooth", portable: true }, is_active: true },
    ...options,
  });
  records.push(record3);

  for (const record of records) {
    await record.validate();
    if (record.category_id != null && !await Category.findByPk(record.category_id, options)) {
      throw new Error("Invalid reference: Article.category_id");
    }
    if (record.brand_id != null && !await Brand.findByPk(record.brand_id, options)) {
      throw new Error("Invalid reference: Article.brand_id");
    }
  }
  return records;
}
