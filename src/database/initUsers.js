import { User } from "../models/User.js";

/** Inicializa Users de ejemplo después de crear sus dependencias. */
export async function initializeUsers(options = {}) {
  const records = [];
  const data1 = { ...{ firebase_uid: null, email: "usuario@example.com", biography: "Entusiasta de la tecnología y las reseñas.", profile_image_url: null, notifications_last_viewed_at: null, is_active: true }, ...{ username: "usuario" } };
  await User.build(data1).validate();
  const [record1] = await User.findOrCreate({
    where: { username: "usuario" },
    defaults: { firebase_uid: null, email: "usuario@example.com", biography: "Entusiasta de la tecnología y las reseñas.", profile_image_url: null, notifications_last_viewed_at: null, is_active: true },
    ...options,
  });
  records.push(record1);

  const data2 = { ...{ firebase_uid: null, email: "mariana@example.com", biography: "Me gustan los dispositivos de audio.", profile_image_url: null, notifications_last_viewed_at: null, is_active: true }, ...{ username: "mariana.tech" } };
  await User.build(data2).validate();
  const [record2] = await User.findOrCreate({
    where: { username: "mariana.tech" },
    defaults: { firebase_uid: null, email: "mariana@example.com", biography: "Me gustan los dispositivos de audio.", profile_image_url: null, notifications_last_viewed_at: null, is_active: true },
    ...options,
  });
  records.push(record2);

  const data3 = { ...{ firebase_uid: null, email: "camila@example.com", biography: "Comparto experiencias con celulares y computadores.", profile_image_url: null, notifications_last_viewed_at: null, is_active: true }, ...{ username: "camila.audio" } };
  await User.build(data3).validate();
  const [record3] = await User.findOrCreate({
    where: { username: "camila.audio" },
    defaults: { firebase_uid: null, email: "camila@example.com", biography: "Comparto experiencias con celulares y computadores.", profile_image_url: null, notifications_last_viewed_at: null, is_active: true },
    ...options,
  });
  records.push(record3);

  for (const record of records) {
    await record.validate();
  }
  return records;
}
