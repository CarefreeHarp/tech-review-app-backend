import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Article = sequelize.define(
  "articles",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "categories", key: "id" } },
    brand_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "brands", key: "id" } },
    name: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    model: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    release_date: { type: DataTypes.DATEONLY, allowNull: true },
    specifications: { type: DataTypes.JSON, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { timestamps: true, underscored: true },
);
