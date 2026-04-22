import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
<<<<<<< HEAD
=======
console.log("Loaded env variables:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);
>>>>>>> origin/feature/InterviewFlow

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
<<<<<<< HEAD
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
=======
    port: Number(process.env.DB_PORT), // <-- convert to number
    host: process.env.DB_HOST,
    dialect: "postgres",
>>>>>>> origin/feature/InterviewFlow
  }
);

export default sequelize;
