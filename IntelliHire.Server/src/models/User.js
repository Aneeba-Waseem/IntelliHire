import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  AutoId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  UserId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: "Please enter a valid email address"
      }
    }
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // New fields
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  verifyToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  CompanyURL: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  }

});

export default User;
