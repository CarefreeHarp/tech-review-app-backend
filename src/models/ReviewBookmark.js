import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const ReviewBookmark = sequelize.define(
  "review_bookmarks",
  {
    user_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "users", key: "id" } },
    review_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, references: { model: "reviews", key: "id" } },
  },
  { timestamps: false },
);
