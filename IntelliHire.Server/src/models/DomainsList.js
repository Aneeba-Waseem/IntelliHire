import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const DomainsList = sequelize.define(
  "DomainsList",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  { tableName: "DomainsList" }
);

export default DomainsList;
