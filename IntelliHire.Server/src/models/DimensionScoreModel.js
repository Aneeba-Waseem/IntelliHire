import { DataTypes } from "sequelize";
import sequelize from "../db.js";

// 1️⃣ DimensionScore table (nested JSON is better than separate table for simplicity)
const DimensionScoreModel = sequelize.define("DimensionScore", {
  key: DataTypes.STRING,         // name of the dimension
  current: DataTypes.FLOAT,
  max: DataTypes.FLOAT,
});

// 2️⃣ Scorecard table
const ScorecardModel = sequelize.define("Scorecard", {
  dimensions: DataTypes.JSONB,  // { dimensionName: {current, max} }
  byDomain: DataTypes.JSONB,    // { domainName: {...} }
  metadata: DataTypes.JSONB,    // role, recent_deltas, etc.
});

// 3️⃣ EvaluationSignals table (embedded JSON could work too)
const EvaluationSignalsModel = sequelize.define("EvaluationSignals", {
  candidateStruggling: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

// 4️⃣ EvaluationResult table
const EvaluationResultModel = sequelize.define("EvaluationResult", {
  scorecard: {
    type: DataTypes.JSONB, // store Scorecard as JSON
    allowNull: false,
    defaultValue: {
      dimensions: {},
      byDomain: {},
      metadata: {},
    },
  },
  delta: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
  },
  signals: {
    type: DataTypes.JSONB,
    defaultValue: {
      candidateStruggling: false,
    },
  },
});

export {
  DimensionScoreModel,
  ScorecardModel,
  EvaluationSignalsModel,
  EvaluationResultModel,
};