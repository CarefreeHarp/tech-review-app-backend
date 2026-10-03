import { Category } from "../models/Category.js";

/** Inicializa Categories de ejemplo después de crear sus dependencias. */
export async function initializeCategories(options = {}) {
  const records = [];
  const data1 = { ...{ parent_category_id: null, description: "Dispositivos de audio." }, ...{ name: "Audio" } };
  await Category.build(data1).validate();
  if (data1.parent_category_id != null && !await Category.findByPk(data1.parent_category_id, options)) {
    throw new Error("Invalid reference: Category.parent_category_id");
  }
  const [record1] = await Category.findOrCreate({
    where: { name: "Audio" },
    defaults: { parent_category_id: null, description: "Dispositivos de audio." },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ parent_category_id: null, description: "Dispositivos móviles." }, ...{ name: "Celulares" } };
  await Category.build(data2).validate();
  if (data2.parent_category_id != null && !await Category.findByPk(data2.parent_category_id, options)) {
    throw new Error("Invalid reference: Category.parent_category_id");
  }
  const [record2] = await Category.findOrCreate({
    where: { name: "Celulares" },
    defaults: { parent_category_id: null, description: "Dispositivos móviles." },
    ...options,
  });
  records.push(record2);

  const data3 = { ...{ parent_category_id: records[0].id, description: "Auriculares y audífonos." }, ...{ name: "Auriculares" } };
  await Category.build(data3).validate();
  if (data3.parent_category_id != null && !await Category.findByPk(data3.parent_category_id, options)) {
    throw new Error("Invalid reference: Category.parent_category_id");
  }
  const [record3] = await Category.findOrCreate({
    where: { name: "Auriculares" },
    defaults: { parent_category_id: records[0].id, description: "Auriculares y audífonos." },
    ...options,
  });
  records.push(record3);

  for (const record of records) {
    await record.validate();
    if (record.parent_category_id != null && !await Category.findByPk(record.parent_category_id, options)) {
      throw new Error("Invalid reference: Category.parent_category_id");
    }
    if (record.parent_category_id === record.id) throw new Error("A category cannot be its own parent");
  }
  return records;
}
