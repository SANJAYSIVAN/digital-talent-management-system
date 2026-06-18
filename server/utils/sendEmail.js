const nodemailer = require("nodemailer");

const requiredEmailConfig = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
];

const isEmailConfigured = () =>
  requiredEmailConfig.every((key) => Boolean(process.env[key]));

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return true;
};

module.exports = {
  isEmailConfigured,
  sendEmail,
};
