import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profile_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notifications_last_viewed_at: {
      type: DataTypes.DATE,
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
