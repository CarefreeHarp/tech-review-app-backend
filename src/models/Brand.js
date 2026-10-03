import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Brand = sequelize.define(
  "brands",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT, allowNull: false, unique: true, validate: { notEmpty: true } },
  },
  { timestamps: false },
);
