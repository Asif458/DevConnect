const jwt = require("jsonwebtoken");
const User = require("../model/userSchema");

// ==========================
//   PROTECT MIDDLEWARE
// ==========================
exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ==========================
//   ROLE-BASED AUTHORIZATION
// ==========================
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};
