import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TechStacksList = sequelize.define(
  "TechStacksList",
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
  { tableName: "TechStacksList" }
);

export default TechStacksList;
