// Import the mongoose library
const mongoose = require("mongoose");

// Define the schema for the Budget model
const budgetSchema = new mongoose.Schema({
  // Reference to the User model (each budget belongs to a specific user)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the 'User' collection
    required: true // User field is mandatory
  },

  // Category name for the budget (e.g., Food, Travel, Rent)
  category: {
    type: String,
    required: true // Category field is mandatory
  },

  // Amount allocated for the specific category
  amount: {
    type: Number,
    required: true // Amount field is mandatory
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Export the Budget model to be used in other parts of the application
module.exports = mongoose.model("Budget", budgetSchema);
