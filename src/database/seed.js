import { User } from "../models/User.js";
import { Article } from "../models/Article.js";

export async function initializeData() {
  try {
    const users = [
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

    const articles = [
      {
        category_id: "smartphone",
        brand_id: "apple",
        name: "iPhone 16 Pro",
        model: "16 Pro",
        description: "Smartphone de gama alta de Apple.",
        image_url: null,
        release_date: "2024-09-20",
        specifications: "Pantalla OLED, chip A18 Pro, cámara triple",
        is_active: true,
      },
      {
        category_id: "smartphone",
        brand_id: "samsung",
        name: "Samsung Galaxy S25 Ultra",
        model: "SM-S938",
        description: "Smartphone de gama alta de Samsung.",
        image_url: null,
        release_date: "2025-02-07",
        specifications: "Pantalla AMOLED, cámara múltiple, Android",
        is_active: true,
      },
      {
        category_id: "laptop",
        brand_id: "apple",
        name: "MacBook Air",
        model: "M4",
        description: "Portátil ligero de Apple.",
        image_url: null,
        release_date: "2025-03-12",
        specifications: "Apple Silicon M4, pantalla Liquid Retina",
        is_active: true,
      },
      {
        category_id: "laptop",
        brand_id: "lenovo",
        name: "Lenovo ThinkPad X1 Carbon",
        model: "Gen 13",
        description: "Portátil empresarial de Lenovo.",
        image_url: null,
        release_date: "2025-01-01",
        specifications: "Pantalla 14 pulgadas, SSD, Windows",
        is_active: true,
      },
      {
        category_id: "headphones",
        brand_id: "sony",
        name: "Sony WH-1000XM5",
        model: "WH-1000XM5",
        description: "Audífonos inalámbricos con cancelación de ruido.",
        image_url: null,
        release_date: "2022-05-20",
        specifications: "Bluetooth, cancelación activa de ruido",
        is_active: true,
      },
    ];

    for (const user of users) {
      await User.findOrCreate({
        where: { email: user.email },
        defaults: user,
      });
    }

    for (const article of articles) {
      await Article.findOrCreate({
        where: {
          name: article.name,
          model: article.model,
        },
        defaults: article,
      });
    }

    console.log("Initial data loaded successfully");
  } catch (error) {
    console.error("Error initializing data:", error);
    throw error;
  }
}