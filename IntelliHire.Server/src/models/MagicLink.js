import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const MagicLink = sequelize.define("MagicLink", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    FK_userId: {
  type: DataTypes.UUID,
  allowNull: false,
},
    expiresAt: {
        type: DataTypes.DATE,
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
});


export default MagicLink;