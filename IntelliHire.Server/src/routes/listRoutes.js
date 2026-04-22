import express from "express";
import DomainsList from "../models/DomainsList.js";
import TechStacksList from "../models/TechStacksList.js";

const router = express.Router();

router.get("/domains", async (req, res) => {
  const domains = await DomainsList.findAll();
  res.json(domains);
});

router.get("/techstacks", async (req, res) => {
  const stacks = await TechStacksList.findAll();
  res.json(stacks);
});

export default router;
