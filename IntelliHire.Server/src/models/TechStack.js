import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import JobDescription from "./JobDescription.js";

const TechStack = sequelize.define(
  "TechStack",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    FK_JobDescription: {
      type: DataTypes.INTEGER,
      references: {
        model: JobDescription,
        key: "id",
      },
    },
  },
  {
    tableName: "TechStack",
  }
);

JobDescription.hasMany(TechStack, { foreignKey: "FK_JobDescription" });
TechStack.belongsTo(JobDescription, { foreignKey: "FK_JobDescription" });

export default TechStack;
