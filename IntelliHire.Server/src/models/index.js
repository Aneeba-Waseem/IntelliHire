import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// Initialize Sequelize
const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

// Import models
import JobDescriptionModel from "./JobDescription.js";
import DomainModel from "./Domain.js";
import TechStackModel from "./TechStack.js";
import ResumeModel from "./Resume.js";
import QualificationModel from "./Qualification.js";
import ExperienceModel from "./Experience.js";
import ProjectModel from "./Project.js";
import InterviewModel from "./Interview.js";

// Initialize models
export const JobDescription = new JobDescriptionModel(db, DataTypes);
export const Domain =new DomainModel(db, DataTypes);
export const TechStack =new TechStackModel(db, DataTypes);
export const Resume =new ResumeModel(db, DataTypes);
export const Qualification =new QualificationModel(db, DataTypes);
export const Experience =new ExperienceModel(db, DataTypes);
export const Project =new ProjectModel(db, DataTypes);
export const Interview =new InterviewModel(db, DataTypes);

// ✅ Named export for Sequelize instance
export { db as sequelize };