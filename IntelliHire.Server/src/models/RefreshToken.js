import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const RefreshToken = sequelize.define(
    "RefreshToken",
    {
        AutoId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        RefreshTokenId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            allowNull: false,
        },

        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        isExpired: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        // FK → User.UserId (UUID)
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
         expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },

    },
    {
        indexes: [
            {
                unique: true,
                fields: ["RefreshTokenId"],
            },
            {
                fields: ["userId"],
            },
        ],
    }
);

// ================= ASSOCIATIONS =================

RefreshToken.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "UserId",
    onDelete: "CASCADE",
});

User.hasMany(RefreshToken, {
    foreignKey: "userId",
    sourceKey: "UserId",
    onDelete: "CASCADE",
});

export default RefreshToken;
