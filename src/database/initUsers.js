import { User } from "../models/User.js";

const initialUsers = [
  {
    email: "juan@example.com",
    username: "juan_sanchez",
    biography: "Entusiasta de la tecnología y los dispositivos móviles.",
    profile_image_url: null,
    notifications_last_viewed_at: null,
    is_active: true,
  },
  {
    email: "alejandro@example.com",
    username: "alejandro_nieto",
    biography: "Aficionado al hardware y los computadores.",
    profile_image_url: null,
    notifications_last_viewed_at: null,
    is_active: true,
  },
  {
    email: "pablo@example.com",
    username: "pablo_dev",
    biography: "Interesado en software, videojuegos y tecnología.",
    profile_image_url: null,
    notifications_last_viewed_at: null,
    is_active: true,
  },
  {
    email: "sebastian@example.com",
    username: "sebastian_tech",
    biography: "Fanático de los smartphones y nuevos dispositivos.",
    profile_image_url: null,
    notifications_last_viewed_at: null,
    is_active: true,
  },
];

export async function initializeUsers() {
  try {
    const count = await User.count();
    if (count === 0) {
      await User.bulkCreate(initialUsers);
      console.log("Initial users loaded");
    }
  } catch (error) {
    console.error("Error initializing users:", error);
    throw error;
  }
}
