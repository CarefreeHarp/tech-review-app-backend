import { Store } from "../models/Store.js";

/** Inicializa Stores de ejemplo después de crear sus dependencias. */
export async function initializeStores(options = {}) {
  const records = [];
  const data1 = { ...{ website_url: "https://tienda-a.example.com" }, ...{ name: "Tienda A" } };
  await Store.build(data1).validate();
  const [record1] = await Store.findOrCreate({
    where: { name: "Tienda A" },
    defaults: { website_url: "https://tienda-a.example.com" },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ website_url: "https://tienda-b.example.com" }, ...{ name: "Tienda B" } };
  await Store.build(data2).validate();
  const [record2] = await Store.findOrCreate({
    where: { name: "Tienda B" },
    defaults: { website_url: "https://tienda-b.example.com" },
    ...options,
  });
  records.push(record2);

  for (const record of records) {
    await record.validate();
  }
  return records;
}
