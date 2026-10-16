import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const ArticleStore = sequelize.define(
  "article_stores",
  {
    article_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "articles", key: "id" } },
    store_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "stores", key: "id" } },
    // Permite conservar los datos de la tienda tal como aparecen en el vínculo del artículo.
    name: { type: DataTypes.TEXT, allowNull: true },
    website_url: { type: DataTypes.TEXT, allowNull: true },
    product_url: { type: DataTypes.TEXT, allowNull: true, validate: { isUrl: true } },
  },
  { timestamps: false },
);
