// Load environment variables first thing
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");
// const passport = require("./config/passport");

// ========================================
// 🔥 IMPORT ALL ROUTES
// ========================================
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const postRoutes = require("./routes/postsRoutes");
const userRoutes = require("./routes/userRoutes");                     
const followRoutes = require("./routes/followRoutes");                 
const friendRequestRoutes = require("./routes/friendRequestRoutes");   
const skillRoutes = require("./routes/skillRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const sessionRoutes = require("./routes/sessionRoutes");


const app = express();

// ========================================
// MIDDLEWARE
// ========================================
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,                // allow cookies
  })
);
// app.use(passport.initialize());

// ========================================
// PING TEST ROUTE
// ========================================
app.get("/ping", (req, res) => res.json({ message: "pong" }));

// ========================================
//   REGISTER ALL ROUTES
// ========================================
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/post", postRoutes);
app.use("/api/users", userRoutes);                     
app.use("/api/follow", followRoutes);                  
app.use("/api/friend-requests", friendRequestRoutes); 
app.use("/api/skills", skillRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/sessions", sessionRoutes);


// ========================================
// CONNECT TO DB & START SERVER
// ========================================
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // stop server if DB fails
  });
