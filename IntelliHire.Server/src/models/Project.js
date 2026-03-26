import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resume from "./Resume.js";

const Project = sequelize.define(
  "Project",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    FK_Resume: {
      type: DataTypes.UUID,
      references: { model: Resume, key: "id" },
    },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    tech_stack: DataTypes.STRING,
    link: DataTypes.STRING,
  },
  { tableName: "Project" }
);

Resume.hasMany(Project, { foreignKey: "FK_Resume" });
export default Project;