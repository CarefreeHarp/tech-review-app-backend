import { User } from "../models/User.js";

/** Inicializa los cuatro perfiles de prueba conservando sus IDs y los cambios posteriores. */
export async function initializeUsers(options = {}) {
  const records = [];
  for (let id = 1; id <= 4; id++) {
    const data = {
      id, username: `prueba${id}`, email: `prueba${id}@gmail.com`,
      firebase_uid: null, biography: "", profile_image_url: null,
      notifications_last_viewed_at: null, is_active: true,
    };
    await User.build(data).validate();
    // Los perfiles ya vinculados a Auth conservan su UID y sus fotos al reiniciar el backend.
    const [record] = await User.findOrCreate({ where: { id }, defaults: data, ...options });
    await record.validate();
    records.push(record);
  }
  return records;
}
