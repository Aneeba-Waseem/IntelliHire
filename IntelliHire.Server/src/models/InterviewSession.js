import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import JobDescription from "./JobDescription.js";

const InterviewSession = sequelize.define("InterviewSession", {
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

  FK_Recruiter: {
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
});

InterviewSession.belongsTo(User, { as: "candidate", foreignKey: "FK_Candidate" });
InterviewSession.belongsTo(User, { as: "recruiter", foreignKey: "FK_Recruiter" });
InterviewSession.belongsTo(JobDescription, { foreignKey: "FK_JobDescription" });
