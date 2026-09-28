import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { Article } from "./Article.js";
import { User } from "./User.js";

export const Review = sequelize.define(
  "reviews",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Article,
        key: "id",
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
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
