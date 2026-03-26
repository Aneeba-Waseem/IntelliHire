import User from "./User.js";
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Resume from "./Resume.js";
import JobDescription from "./JobDescription.js";

const Interview = sequelize.define(
  "Interview",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    FK_JobDescription: {
      type: DataTypes.INTEGER,
      references: { model: JobDescription, key: "id" },
    },

    FK_Resume: {
      type: DataTypes.UUID,
      references: { model: Resume, key: "id" },
    },

    FK_Users: {
      type: DataTypes.INTEGER,
      references: { model: User, key: "AutoId" },
    },

    date: DataTypes.DATEONLY,
    time: DataTypes.TIME,
    duration: DataTypes.INTEGER,

    IsCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { tableName: "Interview" }
);

export default Interview;