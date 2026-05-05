// import nodemailer from "nodemailer";
// import { render } from "@react-email/render";
// import React from "react";
// import InterviewScheduled from "../emails/InterviewScheduled.js";

// export const sendInterviewEmails = async (emailData) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   for (const i of emailData) {

//     // const link = `http://localhost:5173/login?token=${i.token}`;

//     const html = await render(
//       React.createElement(InterviewScheduled, {
//         name: i.name,
//         date: i.date,
//         time: i.time,
//         link: i.link,
//       })
//     );

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: i.email,
//       subject: "Your Interview Schedule",
//       html,
//     });
//   }


// };

import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import InterviewScheduled from "../emails/InterviewScheduled.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInterviewEmails = async (emailData) => {
  for (const i of emailData) {

    const html = await render(
      React.createElement(InterviewScheduled, {
        name: i.name,
        date: i.date,
        time: i.time,
        link: i.link,
      })
    );

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: i.email,
      subject: "Your Interview Schedule",
      html,
    });
  }
};
