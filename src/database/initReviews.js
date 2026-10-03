import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Article } from "../models/Article.js";

/** Inicializa Reviews de ejemplo después de crear sus dependencias. */
export async function initializeReviews(users, articles, options = {}) {
  const records = [];
  const data1 = { ...{ rating: 5, body: "El sonido es claro y son cómodos para estudiar.", is_active: true }, ...{ user_id: users[0].id, article_id: articles[0].id, title: "Buen sonido" } };
  await Review.build(data1).validate();
  if (data1.user_id != null && !await User.findByPk(data1.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data1.article_id != null && !await Article.findByPk(data1.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record1] = await Review.findOrCreate({
    where: { user_id: users[0].id, article_id: articles[0].id, title: "Buen sonido" },
    defaults: { rating: 5, body: "El sonido es claro y son cómodos para estudiar.", is_active: true },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ rating: 4, body: "La batería dura todo el día y la pantalla se ve muy bien.", is_active: true }, ...{ user_id: users[0].id, article_id: articles[1].id, title: "Buena batería" } };
  await Review.build(data2).validate();
  if (data2.user_id != null && !await User.findByPk(data2.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data2.article_id != null && !await Article.findByPk(data2.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record2] = await Review.findOrCreate({
    where: { user_id: users[0].id, article_id: articles[1].id, title: "Buena batería" },
    defaults: { rating: 4, body: "La batería dura todo el día y la pantalla se ve muy bien.", is_active: true },
    ...options,
  });
  records.push(record2);

  const data3 = { ...{ rating: 4, body: "La cancelación de ruido ayuda durante los viajes.", is_active: true }, ...{ user_id: users[1].id, article_id: articles[0].id, title: "Muy cómodos" } };
  await Review.build(data3).validate();
  if (data3.user_id != null && !await User.findByPk(data3.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data3.article_id != null && !await Article.findByPk(data3.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record3] = await Review.findOrCreate({
    where: { user_id: users[1].id, article_id: articles[0].id, title: "Muy cómodos" },
    defaults: { rating: 4, body: "La cancelación de ruido ayuda durante los viajes.", is_active: true },
    ...options,
  });
  records.push(record3);

  const data4 = { ...{ rating: 5, body: "Es fácil de transportar y tiene buen volumen.", is_active: true }, ...{ user_id: users[1].id, article_id: articles[2].id, title: "Buen parlante" } };
  await Review.build(data4).validate();
  if (data4.user_id != null && !await User.findByPk(data4.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data4.article_id != null && !await Article.findByPk(data4.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record4] = await Review.findOrCreate({
    where: { user_id: users[1].id, article_id: articles[2].id, title: "Buen parlante" },
    defaults: { rating: 5, body: "Es fácil de transportar y tiene buen volumen.", is_active: true },
    ...options,
  });
  records.push(record4);

  const data5 = { ...{ rating: 5, body: "Las fotografías tienen buen detalle durante el día.", is_active: true }, ...{ user_id: users[2].id, article_id: articles[1].id, title: "Buena cámara" } };
  await Review.build(data5).validate();
  if (data5.user_id != null && !await User.findByPk(data5.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data5.article_id != null && !await Article.findByPk(data5.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record5] = await Review.findOrCreate({
    where: { user_id: users[2].id, article_id: articles[1].id, title: "Buena cámara" },
    defaults: { rating: 5, body: "Las fotografías tienen buen detalle durante el día.", is_active: true },
    ...options,
  });
  records.push(record5);

  const data6 = { ...{ rating: 4, body: "La conexión es estable y es fácil de usar.", is_active: true }, ...{ user_id: users[2].id, article_id: articles[2].id, title: "Práctico" } };
  await Review.build(data6).validate();
  if (data6.user_id != null && !await User.findByPk(data6.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data6.article_id != null && !await Article.findByPk(data6.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record6] = await Review.findOrCreate({
    where: { user_id: users[2].id, article_id: articles[2].id, title: "Práctico" },
    defaults: { rating: 4, body: "La conexión es estable y es fácil de usar.", is_active: true },
    ...options,
  });
  records.push(record6);

  for (const record of records) {
    await record.validate();
    if (record.user_id != null && !await User.findByPk(record.user_id, options)) {
      throw new Error("Invalid reference: Review.user_id");
    }
    if (record.article_id != null && !await Article.findByPk(record.article_id, options)) {
      throw new Error("Invalid reference: Review.article_id");
    }
  }
  return records;
}
