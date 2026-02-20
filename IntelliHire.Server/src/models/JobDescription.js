import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const JobDescription = sequelize.define(
  "JobDescription",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    FK_Users: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "AutoId",
      },
    },
    JobRole: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Experience: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "JobDescription",
  }
);

// Relationships
User.hasMany(JobDescription, { foreignKey: "FK_Users" });
JobDescription.belongsTo(User, { foreignKey: "FK_Users" });

export default JobDescription;
