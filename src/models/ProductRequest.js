import { randomUUID } from "node:crypto";
import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

/** Solicitud de producto con el mismo identificador y los campos del documento Firestore. */
export const ProductRequest = sequelize.define(
  "product_requests",
  {
    id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true, defaultValue: () => randomUUID() },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
    product_name: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.TEXT, allowNull: true },
    brand: { type: DataTypes.TEXT, allowNull: true },
    // El formulario guarda texto; conservarlo evita reinterpretar o cambiar la fecha recibida.
    release_date: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.TEXT, allowNull: false, defaultValue: "pending", validate: { notEmpty: true } },
  },
  { timestamps: true, createdAt: "createdAt", updatedAt: false, underscored: true },
);
