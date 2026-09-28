import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Article = sequelize.define(
  "articles",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    model: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    release_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    specifications: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);
