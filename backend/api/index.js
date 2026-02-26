const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const session = require("express-session");
const passport = require("../config/passport");

// Import routes
const authRoutes = require('../routes/authRoutes');
const incomeRoutes = require('../routes/incomeRoutes');
const expenseRoutes = require('../routes/expenseRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const budgetRoutes = require('../routes/budgetRoutes');
const aiRoutes = require('../routes/aiRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" 
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Function to handle MongoDB connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Middleware to connect to DB on every request (standard for Vercel serverless)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/expense', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/budget', budgetRoutes);
app.use('/api/v1/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TrackO API is running' });
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Export for Vercel
module.exports = app;
 