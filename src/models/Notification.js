import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Notification = sequelize.define(
  "notifications",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
    actor_user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
    type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [["review_like", "comment_like", "comment", "follow"]] } },
    review_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "reviews", key: "id" } },
    comment_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: "comments", key: "id" } },
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: false },
);
