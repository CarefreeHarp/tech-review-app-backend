import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Category = sequelize.define(
  "categories",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    parent_category_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "categories", key: "id" } },
    name: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: false },
);
