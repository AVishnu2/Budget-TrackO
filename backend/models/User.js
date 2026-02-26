// Import required libraries
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing and comparing passwords

// Define the schema for the User model
const UserSchema = new mongoose.Schema({
  // User's full name
  fullName: {
    type: String,
    required: true
  },

  // User's email address (must be unique)
  email: {
    type: String,
    required: true,
    unique: true
  },

  // Password for local authentication (optional for Google users)
  password: {
    type: String,
    required: false
  },

  // Optional profile image URL (e.g., for Google profile picture or custom upload)
  profileImageUrl: {
    type: String,
    default: null
  },

  // Google ID for OAuth users (unique but sparse to allow null values)
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Authentication provider — either local (manual signup) or google (OAuth)
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

}, {
  // Automatically adds createdAt and updatedAt timestamps
  timestamps: true
});

// Middleware: Hash password before saving to the database
// Runs only if the password is new or modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next(); // Skip if no password or unchanged
  this.password = await bcrypt.hash(this.password, 10); // Hash password with salt rounds = 10
  next();
});

// Method: Compare entered password with stored hashed password
// Used during login for local authentication
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // No password (Google user)
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export the User model to use in other parts of the application
module.exports = mongoose.model('User', UserSchema);
