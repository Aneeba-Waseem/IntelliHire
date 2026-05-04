// import { Sequelize } from "sequelize";

// // ❌ Only load dotenv locally
// if (process.env.NODE_ENV !== "production") {
//   const dotenv = await import("dotenv");
//   dotenv.config();
// }

// // ✅ Validate env
// if (!process.env.DATABASE_URL) {
//   throw new Error("DB_URL is not defined");
// }

// // ✅ Clean Railway-compatible setup
// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: "postgres",
//   logging: false,

//   dialectOptions: {
//     ssl: process.env.NODE_ENV === "production"
//       ? { require: true, rejectUnauthorized: false }
//       : false,
//   },
// });

// export default sequelize;

// export default sequelize;
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
console.log("Loaded env variables:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    port: Number(process.env.DB_PORT), // <-- convert to number
    host: process.env.DB_HOST,
    dialect: "postgres",
  }
);

export default sequelize;