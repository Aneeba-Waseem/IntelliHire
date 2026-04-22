import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import InterviewSession from "../cacheModels/InterviewSession.js";
const QuestionResponse = sequelize.define("QuestionResponse", {
  questionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  domain: DataTypes.STRING,
  topic: DataTypes.STRING,

  question_text: DataTypes.TEXT,
  candidate_answer: DataTypes.TEXT,
  ideal_answer: DataTypes.TEXT,

  phase: DataTypes.STRING,
  depthLevel: DataTypes.INTEGER,

  timestamp: DataTypes.DATE,

  // 🔥 Store evaluation_output EXACTLY as-is
  evaluation_output: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },

  FK_Session: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

InterviewSession.hasMany(QuestionResponse, { foreignKey: "FK_Session" });
QuestionResponse.belongsTo(InterviewSession, { foreignKey: "FK_Session" });