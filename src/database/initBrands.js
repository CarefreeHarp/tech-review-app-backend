import { Brand } from "../models/Brand.js";

/** Inicializa Brands de ejemplo después de crear sus dependencias. */
export async function initializeBrands(options = {}) {
  const records = [];
  const data1 = { ...{}, ...{ name: "Sony" } };
  await Brand.build(data1).validate();
  const [record1] = await Brand.findOrCreate({
    where: { name: "Sony" },
    defaults: {},
    ...options,
  });
  records.push(record1);

  const data2 = { ...{}, ...{ name: "Samsung" } };
  await Brand.build(data2).validate();
  const [record2] = await Brand.findOrCreate({
    where: { name: "Samsung" },
    defaults: {},
    ...options,
  });
  records.push(record2);

  // Las imágenes de hardware no identifican un fabricante concreto.
  for (const name of ["Personalizado", "Genérica", "Epic Games"]) {
    await Brand.build({ name }).validate();
    const [record] = await Brand.findOrCreate({ where: { name }, defaults: {}, ...options });
    records.push(record);
  }

  for (const record of records) {
    await record.validate();
  }
  return records;
}
