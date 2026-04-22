import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const SessionEvaluationSummary = sequelize.define("SessionEvaluationSummary", {
  FK_Session: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  scorecard: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },

  overallScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
});