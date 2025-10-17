// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");

exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    const user = await User.findById(decoded.userId).select("+password +passwordChangedAt");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // If user changed password after token was issued, invalidate token
    if (user.passwordChangedAt) {
      const pwdChangedTs = parseInt(new Date(user.passwordChangedAt).getTime() / 1000, 10);
      if (decoded.iat < pwdChangedTs) {
        return res.status(401).json({ message: "Password changed recently. Please login again." });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Not authorized" });
  }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied: insufficient permissions" });
  }
  next();
};
