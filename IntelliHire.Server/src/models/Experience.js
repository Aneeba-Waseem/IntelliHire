import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resume from "./Resume.js";

const Experience = sequelize.define(
  "Experience",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    FK_Resume: {
      type: DataTypes.UUID,
      references: { model: Resume, key: "id" },
    },
    title: DataTypes.STRING,
    organization: DataTypes.STRING,
    start_date: DataTypes.STRING,
    end_date: DataTypes.STRING,
    years: DataTypes.FLOAT,
    description: DataTypes.TEXT,
  },
  { tableName: "Experience" }
);

Resume.hasMany(Experience, { foreignKey: "FK_Resume" });
export default Experience;