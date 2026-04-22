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
    candidateUserId: {
      type: DataTypes.INTEGER,   // ✅ match AutoId type
      allowNull: true,
      references: { model: User, key: "AutoId" },
    }
  },
  { tableName: "Interview" }
);

export default Interview;


Interview.belongsTo(JobDescription, {
  foreignKey: "FK_JobDescription",
});

JobDescription.hasMany(Interview, {
  foreignKey: "FK_JobDescription",
});

// ✅ ADD THIS
Interview.belongsTo(Resume, {
  foreignKey: "FK_Resume",
});


Resume.hasMany(Interview, {
  foreignKey: "FK_Resume",
});

Interview.belongsTo(User, {
  foreignKey: "FK_Users",
});

User.hasMany(Interview, {
  foreignKey: "FK_Users",
});

Interview.belongsTo(User, {
  foreignKey: "candidateUserId",
  as: "candidate",
});