import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("devicers", "postgres", "devicers", {
  port: 5432,
  host: "localhost",
  dialect: "postgres",
});
