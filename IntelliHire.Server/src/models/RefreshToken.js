import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const RefreshToken = sequelize.define("RefreshToken", {
    AutoId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    RefreshTokenId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isExpired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

// Associations
RefreshToken.belongsTo(User, { foreignKey: "userId" });
User.hasMany(RefreshToken, { foreignKey: "userId" });

export default RefreshToken;
