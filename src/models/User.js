import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const User = sequelize.define(
  "users",
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    firebase_uid: { type: DataTypes.TEXT, allowNull: true, unique: true },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true, validate: { isEmail: true } },
    username: { type: DataTypes.TEXT, allowNull: false, unique: true, validate: { notEmpty: true } },
    biography: { type: DataTypes.TEXT, allowNull: true },
    profile_image_url: { type: DataTypes.TEXT, allowNull: true },
    notifications_last_viewed_at: { type: DataTypes.DATE, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // La app lo marca cuando Firebase Auth confirma el correo; las cuentas sociales llegan verificadas.
    email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { timestamps: true, underscored: true },
);
