import express from "express";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import React from "react";
import InterviewScheduled from "../emails/InterviewScheduled.js";
const router = express.Router();

router.post("/send-interview-emails", async (req, res) => {
  try {
    const { interviews } = req.body; // [{name,email,date,time}]

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("Sending interview emails to:", interviews.map(i => i.email));
    const link = "http://localhost:5173/auth";

    for (const i of interviews) {
     const html = await render(
  React.createElement(InterviewScheduled, {
    name: i.name,
    date: i.date,
    time: i.time,
    link,
  })
);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: i.email,
        subject: "Your Interview Schedule",
        html,
      });
    }

    res.json({ ok: true, sent: interviews.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;