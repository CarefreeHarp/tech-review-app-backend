import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Article } from "../models/Article.js";

/** Inicializa Reviews de ejemplo después de crear sus dependencias. */
export async function initializeReviews(users, articles, options = {}) {
  const records = [];
  const data1 = { ...{ rating: 5, body: "Llevo varias semanas usando este PC de escritorio para estudiar, programar y jugar después de clase. Lo que más destaca es la torre negra con paneles transparentes y varios ventiladores iluminados en azul, exactamente como se ve en la foto. Me gusta ver el interior y tener un equipo fijo con el teclado, el monitor y mis archivos siempre a mano. Para mis proyectos y tareas habituales me ha resultado cómodo trabajar aquí. Hay que reservarle espacio en el escritorio y dejar libres las entradas de aire; tampoco es un equipo para llevar de un lugar a otro. La iluminación azul luce muy bien, aunque de noche prefiero acompañarla con una luz suave en la habitación.", is_active: true }, ...{ user_id: users[0].id, article_id: articles[0].id, title: "PC de escritorio azul: cómodo para estudiar y jugar" } };
  // Conserva el ID de la reseña inicial anterior y sus relaciones al renovar el texto.
  const legacy1 = await Review.findOne({
    where: { user_id: data1.user_id, article_id: data1.article_id, title: "Buen sonido" },
    ...options,
  }) ?? await Review.findOne({
    where: { user_id: data1.user_id, article_id: data1.article_id, title: "Un PC de escritorio que luce tan bien como trabaja" },
    ...options,
  });
  if (legacy1) await legacy1.update({ title: data1.title, body: data1.body }, options);
  await Review.build(data1).validate();
  if (data1.user_id != null && !await User.findByPk(data1.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data1.article_id != null && !await Article.findByPk(data1.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record1] = await Review.findOrCreate({
    where: { user_id: users[0].id, article_id: articles[0].id, title: "PC de escritorio azul: cómodo para estudiar y jugar" },
    defaults: { rating: 5, body: "Llevo varias semanas usando este PC de escritorio para estudiar, programar y jugar después de clase. Lo que más destaca es la torre negra con paneles transparentes y varios ventiladores iluminados en azul, exactamente como se ve en la foto. Me gusta ver el interior y tener un equipo fijo con el teclado, el monitor y mis archivos siempre a mano. Para mis proyectos y tareas habituales me ha resultado cómodo trabajar aquí. Hay que reservarle espacio en el escritorio y dejar libres las entradas de aire; tampoco es un equipo para llevar de un lugar a otro. La iluminación azul luce muy bien, aunque de noche prefiero acompañarla con una luz suave en la habitación.", is_active: true },
    ...options,
  });
  // Mantiene el contenido del init actualizado al conservar una base existente.
  await record1.update({ title: data1.title, body: data1.body }, options);
  records.push(record1);

  const data2 = { ...{ rating: 4, body: "Estos audífonos negros de diadema son los que uso para escuchar música mientras estudio. Las copas grandes rodean las orejas y las almohadillas acolchadas hacen que pueda llevarlos durante una sesión de lectura sin tener que acomodarlos a cada rato. El diseño de la foto coincide con lo que me gusta de ellos: una diadema amplia, copas cerradas y controles en el lateral. Escucho las voces con claridad a un volumen moderado y puedo pausar sin quitarme los audífonos. Después de varias horas noto calor en las orejas, así que hago descansos. Para el escritorio me parecen prácticos; para un bolso pequeño ocupan bastante espacio.", is_active: true }, ...{ user_id: users[0].id, article_id: articles[1].id, title: "Audífonos negros de diadema para estudiar con música" } };
  // Conserva el ID de la reseña inicial anterior y sus relaciones al renovar el texto.
  const legacy2 = await Review.findOne({
    where: { user_id: data2.user_id, article_id: data2.article_id, title: "Buena batería" },
    ...options,
  }) ?? await Review.findOne({
    where: { user_id: data2.user_id, article_id: data2.article_id, title: "Audífonos cómodos para música y sesiones de estudio" },
    ...options,
  });
  if (legacy2) await legacy2.update({ title: data2.title, body: data2.body }, options);
  await Review.build(data2).validate();
  if (data2.user_id != null && !await User.findByPk(data2.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data2.article_id != null && !await Article.findByPk(data2.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record2] = await Review.findOrCreate({
    where: { user_id: users[0].id, article_id: articles[1].id, title: "Audífonos negros de diadema para estudiar con música" },
    defaults: { rating: 4, body: "Estos audífonos negros de diadema son los que uso para escuchar música mientras estudio. Las copas grandes rodean las orejas y las almohadillas acolchadas hacen que pueda llevarlos durante una sesión de lectura sin tener que acomodarlos a cada rato. El diseño de la foto coincide con lo que me gusta de ellos: una diadema amplia, copas cerradas y controles en el lateral. Escucho las voces con claridad a un volumen moderado y puedo pausar sin quitarme los audífonos. Después de varias horas noto calor en las orejas, así que hago descansos. Para el escritorio me parecen prácticos; para un bolso pequeño ocupan bastante espacio.", is_active: true },
    ...options,
  });
  // Mantiene el contenido del init actualizado al conservar una base existente.
  await record2.update({ title: data2.title, body: data2.body }, options);
  records.push(record2);

  const data3 = { ...{ rating: 4, body: "Elegí este PC de escritorio porque me gustó la torre con paneles transparentes y ventiladores con iluminación azul que aparece en la imagen. Ya instalado, se convirtió en el centro de mi escritorio para las clases, los proyectos y algunas partidas por la noche. Poder ver el interior me ayuda a notar cuándo se acumula polvo y toca hacer una limpieza. La luz azul resalta bastante, especialmente con la habitación oscura, y por eso prefiero usar una lámpara suave al lado del monitor. También recomiendo dejar espacio alrededor de la torre para que circule el aire. Es un equipo vistoso y cómodo para tener fijo en casa, aunque no sirve para llevarlo a clase como un portátil.", is_active: true }, ...{ user_id: users[1].id, article_id: articles[0].id, title: "Una torre transparente con ventiladores azules" } };
  // Conserva el ID de la reseña inicial anterior y sus relaciones al renovar el texto.
  const legacy3 = await Review.findOne({
    where: { user_id: data3.user_id, article_id: data3.article_id, title: "Muy cómodos" },
    ...options,
  }) ?? await Review.findOne({
    where: { user_id: data3.user_id, article_id: data3.article_id, title: "Una torre con iluminación azul para mi escritorio" },
    ...options,
  });
  if (legacy3) await legacy3.update({ title: data3.title, body: data3.body }, options);
  await Review.build(data3).validate();
  if (data3.user_id != null && !await User.findByPk(data3.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data3.article_id != null && !await Article.findByPk(data3.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record3] = await Review.findOrCreate({
    where: { user_id: users[1].id, article_id: articles[0].id, title: "Una torre transparente con ventiladores azules" },
    defaults: { rating: 4, body: "Elegí este PC de escritorio porque me gustó la torre con paneles transparentes y ventiladores con iluminación azul que aparece en la imagen. Ya instalado, se convirtió en el centro de mi escritorio para las clases, los proyectos y algunas partidas por la noche. Poder ver el interior me ayuda a notar cuándo se acumula polvo y toca hacer una limpieza. La luz azul resalta bastante, especialmente con la habitación oscura, y por eso prefiero usar una lámpara suave al lado del monitor. También recomiendo dejar espacio alrededor de la torre para que circule el aire. Es un equipo vistoso y cómodo para tener fijo en casa, aunque no sirve para llevarlo a clase como un portátil.", is_active: true },
    ...options,
  });
  // Mantiene el contenido del init actualizado al conservar una base existente.
  await record3.update({ title: data3.title, body: data3.body }, options);
  records.push(record3);

  const data4 = { ...{ rating: 5, body: "Probé la grieta portátil de Fortnite cuando la tormenta nos estaba cerrando el paso y ya no teníamos una salida cómoda. La esfera con la grieta azul de la imagen representa justo el objeto que usamos para cambiar de posición y buscar un aterrizaje más seguro. Antes de activarla avisé a mis compañeros y marcamos una zona para no terminar separados. Ese pequeño acuerdo hizo la diferencia: pudimos reagruparnos y seguir jugando con más calma. El efecto visual es llamativo, pero lo importante es mirar el entorno mientras desciendes. Si aterrizas sin pensar puedes caer junto a otro equipo. Bien utilizada me parece una herramienta divertida para escapar y replantear la partida.", is_active: true }, ...{ user_id: users[1].id, article_id: articles[2].id, title: "La grieta portátil de Fortnite salvó a mi equipo" } };
  // Conserva el ID de la reseña inicial anterior y sus relaciones al renovar el texto.
  const legacy4 = await Review.findOne({
    where: { user_id: data4.user_id, article_id: data4.article_id, title: "Buen parlante" },
    ...options,
  }) ?? await Review.findOne({
    where: { user_id: data4.user_id, article_id: data4.article_id, title: "La grieta de Fortnite me salvó una partida" },
    ...options,
  });
  if (legacy4) await legacy4.update({ title: data4.title, body: data4.body }, options);
  await Review.build(data4).validate();
  if (data4.user_id != null && !await User.findByPk(data4.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data4.article_id != null && !await Article.findByPk(data4.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record4] = await Review.findOrCreate({
    where: { user_id: users[1].id, article_id: articles[2].id, title: "La grieta portátil de Fortnite salvó a mi equipo" },
    defaults: { rating: 5, body: "Probé la grieta portátil de Fortnite cuando la tormenta nos estaba cerrando el paso y ya no teníamos una salida cómoda. La esfera con la grieta azul de la imagen representa justo el objeto que usamos para cambiar de posición y buscar un aterrizaje más seguro. Antes de activarla avisé a mis compañeros y marcamos una zona para no terminar separados. Ese pequeño acuerdo hizo la diferencia: pudimos reagruparnos y seguir jugando con más calma. El efecto visual es llamativo, pero lo importante es mirar el entorno mientras desciendes. Si aterrizas sin pensar puedes caer junto a otro equipo. Bien utilizada me parece una herramienta divertida para escapar y replantear la partida.", is_active: true },
    ...options,
  });
  // Mantiene el contenido del init actualizado al conservar una base existente.
  await record4.update({ title: data4.title, body: data4.body }, options);
  records.push(record4);

  const data5 = { ...{ rating: 5, body: "He usado estos audífonos negros de diadema para escuchar álbumes completos, ver videos y acompañar mis sesiones de trabajo en casa. Las copas acolchadas que se ven en la foto rodean las orejas y la diadema se ajusta para que no queden demasiado flojos. Me gusta el diseño sobrio y poder encontrar los controles del lateral sin volver al teléfono cada vez que quiero pausar. Las voces de los videos se entienden bien a un volumen moderado y la música me ayuda a concentrarme. Después de un rato largo noto calor, así que me los quito unos minutos. Ocupan más espacio que unos audífonos pequeños, pero para tenerlos junto al computador me han resultado cómodos.", is_active: true }, ...{ user_id: users[2].id, article_id: articles[1].id, title: "Audífonos negros cómodos para música y trabajo" } };
  // Conserva el ID de la reseña inicial anterior y sus relaciones al renovar el texto.
  const legacy5 = await Review.findOne({
    where: { user_id: data5.user_id, article_id: data5.article_id, title: "Buena cámara" },
    ...options,
  }) ?? await Review.findOne({
    where: { user_id: data5.user_id, article_id: data5.article_id, title: "Buen sonido y una diadema cómoda para el día a día" },
    ...options,
  });
  if (legacy5) await legacy5.update({ title: data5.title, body: data5.body }, options);
  await Review.build(data5).validate();
  if (data5.user_id != null && !await User.findByPk(data5.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data5.article_id != null && !await Article.findByPk(data5.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record5] = await Review.findOrCreate({
    where: { user_id: users[2].id, article_id: articles[1].id, title: "Audífonos negros cómodos para música y trabajo" },
    defaults: { rating: 5, body: "He usado estos audífonos negros de diadema para escuchar álbumes completos, ver videos y acompañar mis sesiones de trabajo en casa. Las copas acolchadas que se ven en la foto rodean las orejas y la diadema se ajusta para que no queden demasiado flojos. Me gusta el diseño sobrio y poder encontrar los controles del lateral sin volver al teléfono cada vez que quiero pausar. Las voces de los videos se entienden bien a un volumen moderado y la música me ayuda a concentrarme. Después de un rato largo noto calor, así que me los quito unos minutos. Ocupan más espacio que unos audífonos pequeños, pero para tenerlos junto al computador me han resultado cómodos.", is_active: true },
    ...options,
  });
  // Mantiene el contenido del init actualizado al conservar una base existente.
  await record5.update({ title: data5.title, body: data5.body }, options);
  records.push(record5);

  const data6 = { ...{ rating: 4, body: "La grieta portátil de Fortnite, esa esfera con una fractura azul brillante que aparece en la imagen, me resulta útil cuando necesito cambiar de posición durante una partida. La he usado para salir de una zona complicada y buscar un lugar desde el que pueda seguir moviéndome. Mi primera recomendación es decidir el destino antes de activarla y avisar al equipo. En una partida me apresuré, miré poco el mapa y terminé aterrizando cerca de otros jugadores. Desde entonces observo el terreno durante el descenso y trato de reunirme con mis compañeros. El efecto visual me encanta, pero no la considero una solución automática: con un buen plan permite escapar; sin él puede dejarte en otra pelea.", is_active: true }, ...{ user_id: users[2].id, article_id: articles[2].id, title: "Grieta de Fortnite: el aterrizaje decide la jugada" } };
  // Conserva el ID de la reseña inicial anterior y sus relaciones al renovar el texto.
  const legacy6 = await Review.findOne({
    where: { user_id: data6.user_id, article_id: data6.article_id, title: "Práctico" },
    ...options,
  }) ?? await Review.findOne({
    where: { user_id: data6.user_id, article_id: data6.article_id, title: "Una grieta útil si eliges bien dónde aterrizar" },
    ...options,
  });
  if (legacy6) await legacy6.update({ title: data6.title, body: data6.body }, options);
  await Review.build(data6).validate();
  if (data6.user_id != null && !await User.findByPk(data6.user_id, options)) {
    throw new Error("Invalid reference: Review.user_id");
  }
  if (data6.article_id != null && !await Article.findByPk(data6.article_id, options)) {
    throw new Error("Invalid reference: Review.article_id");
  }
  const [record6] = await Review.findOrCreate({
    where: { user_id: users[2].id, article_id: articles[2].id, title: "Grieta de Fortnite: el aterrizaje decide la jugada" },
    defaults: { rating: 4, body: "La grieta portátil de Fortnite, esa esfera con una fractura azul brillante que aparece en la imagen, me resulta útil cuando necesito cambiar de posición durante una partida. La he usado para salir de una zona complicada y buscar un lugar desde el que pueda seguir moviéndome. Mi primera recomendación es decidir el destino antes de activarla y avisar al equipo. En una partida me apresuré, miré poco el mapa y terminé aterrizando cerca de otros jugadores. Desde entonces observo el terreno durante el descenso y trato de reunirme con mis compañeros. El efecto visual me encanta, pero no la considero una solución automática: con un buen plan permite escapar; sin él puede dejarte en otra pelea.", is_active: true },
    ...options,
  });
  // Mantiene el contenido del init actualizado al conservar una base existente.
  await record6.update({ title: data6.title, body: data6.body }, options);
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
