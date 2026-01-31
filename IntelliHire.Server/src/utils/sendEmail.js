import nodemailer from "nodemailer";

const sendEmail = async (to, subject, htmlContent) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // e.g., smtp.gmail.com
    port: process.env.SMTP_PORT || 587,
    secure: false,                     // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,     // your email
      pass: process.env.SMTP_PASS,     // your email password or app password
    },
  });

  // Send email
  await transporter.sendMail({
    from: `"IntelliHire" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};

export default sendEmail;
