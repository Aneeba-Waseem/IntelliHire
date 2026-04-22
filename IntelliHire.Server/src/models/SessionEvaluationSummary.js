import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SessionEvaluationSummary = sequelize.define("SessionEvaluationSummary", {
  FK_Session: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  domainScores: {
    // [{ domain: "DSA", avgScore: 3.5 }]
    type: DataTypes.JSONB,
    defaultValue: [],
  },

  overallScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
});

export default SessionEvaluationSummary;