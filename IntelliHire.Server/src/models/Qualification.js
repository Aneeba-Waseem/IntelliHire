import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resume from "./Resume.js";

const Qualification = sequelize.define(
  "Qualification",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    FK_Resume: {
      type: DataTypes.UUID,
      references: { model: Resume, key: "id" },
    },
    degree_name: DataTypes.STRING,
    institute: DataTypes.STRING,
    start_date: DataTypes.STRING,
    end_date: DataTypes.STRING,
    grade: DataTypes.STRING,
  },
  { tableName: "Qualification" }
);

Resume.hasMany(Qualification, { foreignKey: "FK_Resume" });
export default Qualification;