import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import JobDescription from "./JobDescription.js";
import User from "./User.js";

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
    Fk_Candidate: {
      type: DataTypes.INTEGER,
      allowNull:false,
      references: {
        model: User,
        key: "AutoId",
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
JobDescription.hasOne(Resume, { foreignKey: "Fk_Candidate" });
Resume.belongsTo(JobDescription, { foreignKey: "FK_JobDescription" });

export default Resume;