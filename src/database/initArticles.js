import { Article } from "../models/Article.js";

const initialArticles = [
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

export async function initializeArticles() {
  try {
    const count = await Article.count();
    if (count === 0) {
      await Article.bulkCreate(initialArticles);
      console.log("Initial articles loaded");
    }
  } catch (error) {
    console.error("Error initializing articles:", error);
    throw error;
  }
}
