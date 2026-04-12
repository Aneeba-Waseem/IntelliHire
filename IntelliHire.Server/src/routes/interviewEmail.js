// utils/sendEmails.js
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import React from "react";
import express from "express"; // ✅ important!

import InterviewScheduled from "../emails/InterviewScheduled.js";
const router = express.Router();

export const sendInterviewEmails = async (interviews) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
};
// isi lie run kia ha
export default router;