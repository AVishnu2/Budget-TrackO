// Import the mongoose library to interact with MongoDB
const mongoose = require("mongoose");

// Define the schema for the Income model
const IncomeSchema = new mongoose.Schema({
  // Reference to the user who earned this income
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // References the 'User' collection
    required: true // Ensures every income record belongs to a user
  },

  // Optional icon to represent the income source visually (e.g., 💼 for Salary)
  icon: { 
    type: String 
  }, 

  // Source of income (e.g., Salary, Freelance, Investments, etc.)
  source: { 
    type: String, 
    required: true // Income source is mandatory
  },

  // Amount of income received
  amount: { 
    type: Number, 
    required: true // Amount field is mandatory
  },

  // Date when the income was received (defaults to current date)
  date: { 
    type: Date, 
    default: Date.now 
  },
}, { 
  // Automatically adds createdAt and updatedAt timestamps
  timestamps: true 
});

// Export the Income model to use it in other parts of the application
module.exports = mongoose.model("Income", IncomeSchema);
