import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === "production" ? undefined : ".env",
});
// const app = express();

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//     res.send('Server is running');
// });
console.log("Loaded env variables in the index:");
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

