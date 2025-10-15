const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,      // e.g., smtp.gmail.com
      port: process.env.SMTP_PORT,      // usually 587
      secure: false,                     // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,    // your email
        pass: process.env.SMTP_PASS,    // your email password or app password
      },
    });

    // 2️⃣ Send mail
    await transporter.sendMail({
      from: `"DevConnect" <${process.env.SMTP_USER}>`, // sender info
      to,        // recipient email
      subject,   // subject line
      text,      // plain text body
      html,      // optional HTML body
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Send Email Error:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
