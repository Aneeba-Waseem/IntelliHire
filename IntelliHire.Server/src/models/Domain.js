import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import JobDescription from "./JobDescription.js";

const Domain = sequelize.define(
  "Domain",
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
    tableName: "Domain",
  }
);

JobDescription.hasMany(Domain, { foreignKey: "FK_JobDescription" });
Domain.belongsTo(JobDescription, { foreignKey: "FK_JobDescription" });

export default Domain;
