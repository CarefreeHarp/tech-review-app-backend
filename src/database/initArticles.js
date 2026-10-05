import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";
import { Brand } from "../models/Brand.js";

/** Inicializa Articles de ejemplo después de crear sus dependencias. */
export async function initializeArticles(categories, brands, options = {}) {
  const records = [];
  const data1 = {
    category_id: categories[3].id, brand_id: brands[2].id,
    name: "PC de escritorio", model: "Torre con iluminación azul",
    description: "PC de escritorio con torre transparente y ventiladores con iluminación azul.",
    image_url: "device_01", release_date: null,
    specifications: {"case": "Paneles transparentes", "lighting": "Azul"}, is_active: true,
  };
  await Article.build(data1).validate();
  if (!await Category.findByPk(data1.category_id, options)) throw new Error("Invalid reference: Article.category_id");
  if (!await Brand.findByPk(data1.brand_id, options)) throw new Error("Invalid reference: Article.brand_id");
  // Actualiza la ficha inicial anterior sin cambiar el ID utilizado por las reseñas.
  const legacy1 = await Article.findOne({
    where: { name: "Auriculares", brand_id: brands[0].id, image_url: data1.image_url }, ...options,
  });
  if (legacy1) await legacy1.update(data1, options);
  const [record1] = await Article.findOrCreate({
    where: { name: data1.name, brand_id: data1.brand_id },
    defaults: data1, ...options,
  });
  records.push(record1);

  const data2 = {
    category_id: categories[2].id, brand_id: brands[3].id,
    name: "Audífonos de diadema", model: "Diseño circumaural negro",
    description: "Audífonos negros de diadema con almohadillas que rodean las orejas y controles laterales.",
    image_url: "device_00", release_date: null,
    specifications: {"design": "Circumaural", "color": "Negro"}, is_active: true,
  };
  await Article.build(data2).validate();
  if (!await Category.findByPk(data2.category_id, options)) throw new Error("Invalid reference: Article.category_id");
  if (!await Brand.findByPk(data2.brand_id, options)) throw new Error("Invalid reference: Article.brand_id");
  // Actualiza la ficha inicial anterior sin cambiar el ID utilizado por las reseñas.
  const legacy2 = await Article.findOne({
    where: { name: "Teléfono", brand_id: brands[1].id, image_url: data2.image_url }, ...options,
  });
  if (legacy2) await legacy2.update(data2, options);
  const [record2] = await Article.findOrCreate({
    where: { name: data2.name, brand_id: data2.brand_id },
    defaults: data2, ...options,
  });
  records.push(record2);

  const data3 = {
    category_id: categories[4].id, brand_id: brands[4].id,
    name: "Grieta de Fortnite", model: "Grieta portátil",
    description: "Objeto de Fortnite representado por una esfera con una grieta azul, utilizado para reposicionarse durante la partida.",
    image_url: "device_09", release_date: null,
    specifications: {"game": "Fortnite", "type": "Objeto de movilidad"}, is_active: true,
  };
  await Article.build(data3).validate();
  if (!await Category.findByPk(data3.category_id, options)) throw new Error("Invalid reference: Article.category_id");
  if (!await Brand.findByPk(data3.brand_id, options)) throw new Error("Invalid reference: Article.brand_id");
  // Actualiza la ficha inicial anterior sin cambiar el ID utilizado por las reseñas.
  const legacy3 = await Article.findOne({
    where: { name: "Parlante portátil", brand_id: brands[0].id, image_url: data3.image_url }, ...options,
  });
  if (legacy3) await legacy3.update(data3, options);
  const [record3] = await Article.findOrCreate({
    where: { name: data3.name, brand_id: data3.brand_id },
    defaults: data3, ...options,
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
