import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Store = sequelize.define(
  "stores",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT, allowNull: false, unique: true, validate: { notEmpty: true } },
    website_url: { type: DataTypes.TEXT, allowNull: true, validate: { isUrl: true } },
  },
  { timestamps: false },
);
