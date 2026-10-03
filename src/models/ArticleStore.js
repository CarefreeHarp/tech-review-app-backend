import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const ArticleStore = sequelize.define(
  "article_stores",
  {
    article_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "articles", key: "id" } },
    store_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "stores", key: "id" } },
    product_url: { type: DataTypes.TEXT, allowNull: true, validate: { isUrl: true } },
  },
  { timestamps: false },
);
