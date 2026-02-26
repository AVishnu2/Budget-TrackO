// Import the User model from the models directory
const User = require("../models/User");

// Import the jsonwebtoken library for creating JWT tokens
const jwt = require("jsonwebtoken");

// 🔐 Generate JWT token with user ID and 1-hour expiration
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// 📝 Register a new user
exports.registerUser = async (req, res) => {
  // Destructure user input from request body
  const { fullName, email, password, profileImageUrl } = req.body;

  // 🚫 Validate required fields
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // 🔍 Check if a user with the same email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // ✅ Create and save the new user in the database
    const user = await User.create({
      fullName,
      email,
      password,
      profileImageUrl,
    });

    // 🎉 Respond with user data and JWT token
    res.status(201).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    // ⚠️ Handle server or database errors
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// 🔐 Login an existing user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 🚫 Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // 🔍 Find user by email
    const user = await User.findOne({ email });

    // ❌ Check if user exists and password matches
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Respond with user data and JWT token
    res.status(200).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    // ⚠️ Handle server or database errors
    res
      .status(500)
      .json({ message: "Error logging in user", error: err.message });
  }
};

// 🔄 Google OAuth callback handler
exports.googleCallback = (req, res) => {
  try {
    // 🔐 Generate token for authenticated user
    const token = generateToken(req.user._id);

    // 🚀 Redirect to dashboard with token and user info in query params
    const redirectUrl = `${process.env.CLIENT_URL}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`;
    res.redirect(redirectUrl);
  } catch (error) {
    // ❌ Redirect to login page on error
    res.redirect(`${process.env.CLIENT_URL}/login?error=authentication_failed`);
  }
};

// 👤 Get authenticated user's info
exports.getUserInfo = async (req, res) => {
  try {
    // 🔍 Find user by ID and exclude password from result
    const user = await User.findById(req.user.id).select("-password");

    // ❌ If user not found, return 404
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Return user data
    res.status(200).json(user);
  } catch (err) {
    // ⚠️ Log and return server error
    console.error(err);
    res.status(500).json({ message: "Error fetching user info" });
  }
};