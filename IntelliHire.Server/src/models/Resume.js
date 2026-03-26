import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import JobDescription from "./JobDescription.js";

const Resume = sequelize.define(
  "Resume",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    FK_JobDescription: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: JobDescription,
        key: "id",
      },
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    github_link: DataTypes.STRING,
    linkedin: DataTypes.STRING,
    coursework_keywords: DataTypes.JSON,
    skills_summary: DataTypes.JSON,
  },
  {
    tableName: "Resume",
  }
);

JobDescription.hasMany(Resume, { foreignKey: "FK_JobDescription" });
Resume.belongsTo(JobDescription, { foreignKey: "FK_JobDescription" });

export default Resume;