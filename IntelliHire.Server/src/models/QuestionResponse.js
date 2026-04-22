import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

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

export default QuestionResponse;