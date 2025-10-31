const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// Create transporter once
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generic email sender
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: `"DevConnect" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Send Email Error:", err);
    throw new Error("Email could not be sent");
  }
};

// OTP generator + sender
const sendOTP = async (user, type = "signup", expiryMinutes = 10) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);

  user.otp = {
    code: hashedOTP,
    type,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
  };
  await user.save();

  const subject = type === "signup" ? "Signup Verification OTP" : "Password Reset OTP";
  const text =
    type === "signup"
      ? `Your OTP for account verification is ${otp}. It expires in ${expiryMinutes} minutes.`
      : `Your OTP for password reset is ${otp}. It expires in ${expiryMinutes} minutes.`;

  await sendEmail({ to: user.email, subject, text });
  return otp;
};

// Admin notification for new pending mentor
const sendAdminNotification = async (user) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL; // store in .env
    const subject = `New Mentor Pending Approval - ${user.name}`;
    const html = `
      <h3>New Mentor Signup Pending Approval</h3>
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Experience:</strong> ${user.mentorProfile?.experience || "N/A"}</p>
      <p>Click below to approve:</p>
      <a href="${process.env.CLIENT_URL}/admin/verify-mentor/${user._id}" style="padding:10px 15px;background:#28a745;color:#fff;text-decoration:none;">Approve Mentor</a>
    `;
    await sendEmail({ to: adminEmail, subject, html });
  } catch (err) {
    console.error("Error sending admin notification:", err);
  }
};

module.exports = { sendEmail, sendOTP, sendAdminNotification };
