import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Comment = sequelize.define(
  "comments",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    review_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "reviews", key: "id" } },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
    parent_comment_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "comments", key: "id" } },
    // Conserva los datos visibles que el documento del comentario guarda en Firestore.
    user_username: { type: DataTypes.TEXT, allowNull: true },
    user_profile_image_url: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { timestamps: true, underscored: true },
);
