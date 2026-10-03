import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const Follow = sequelize.define(
  "follows",
  {
    follower_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "users", key: "id" } },
    followed_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "users", key: "id" } },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: false },
);
