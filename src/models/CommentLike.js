import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const CommentLike = sequelize.define(
  "comment_likes",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
    comment_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "comments", key: "id" } },
    // Las nuevas relaciones guardan su fecha; la migración completa las fechas de prueba ausentes.
    created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  },
  { timestamps: false, indexes: [{"unique": true, "fields": ["user_id", "comment_id"]}] },
);
