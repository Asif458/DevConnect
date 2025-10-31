const sendEmail = require("../utils/sendEmail");

const sendMailController = async (req, res) => {
  try {
    const { email, type, data } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" });
    }

    let subject, html, text;

    switch (type) {
      case "OTP":
        subject = "Your DevConnect OTP Code";
        text = `Your OTP code is ${data.otp}`;
        html = `<p>Your OTP is: <b>${data.otp}</b></p>`;
        break;

      case "RESET_PASSWORD":
        subject = "Reset Your DevConnect Password";
        text = `Click here to reset your password: ${data.resetLink}`;
        html = `<p>Click <a href="${data.resetLink}">here</a> to reset your password.</p>`;
        break;

      case "WELCOME":
        subject = "Welcome to DevConnect!";
        text = `Welcome ${data.name}! Thanks for joining DevConnect.`;
        html = `<h2>Welcome, ${data.name} 🎉</h2><p>We’re thrilled to have you on board.</p>`;
        break;

      default:
        return res.status(400).json({ message: "Invalid mail type" });
    }

    await sendEmail({ to: email, subject, text, html });

    res.status(200).json({ message: `Mail sent successfully to ${email}` });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ message: "Mail sending failed", error: error.message });
  }
};

module.exports = { sendMailController };
