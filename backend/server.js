require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const {
  registerUser,
  loginUser,
  getUserInfo,
  googleCallback
} = require("./controllers/authController");
const { protect } = require("./middleware/authMiddleware");
const upload = require("./middleware/uploadMiddleware");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware to handle CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// Handle preflight requests
app.options('*', cors());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

connectDB();

// Test routes - define these first
app.get("/", (req, res) => {
  res.json({ message: "Root endpoint working" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "TrackO API is running" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Test endpoint working" });
});

// Debug: Log when mounting routes
console.log("Mounting API routes...");

app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/budget", budgetRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/auth", authRoutes);
// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Handle all other routes (this should be LAST)
app.use("*", (req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});