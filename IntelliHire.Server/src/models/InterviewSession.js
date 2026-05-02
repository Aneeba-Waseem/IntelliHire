import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import JobDescription from "./JobDescription.js";

const InterviewSession = sequelize.define(
  "InterviewSession",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },

    FK_Candidate: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "AutoId",
      },
    },

    FK_JobDescription: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: JobDescription,
        key: "id",
      },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["FK_Candidate", "FK_JobDescription"], // 🔥 THIS LINE
      },
    ],
  }
);

export default InterviewSession;