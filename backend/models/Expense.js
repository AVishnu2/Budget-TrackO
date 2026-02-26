// Import the mongoose library for MongoDB object modeling
const mongoose = require("mongoose");

// Define the schema for the Expense model
const ExpenseSchema = new mongoose.Schema({
  // Reference to the user who created this expense
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // References the 'User' model
    required: true // This field is mandatory
  },

  // Optional icon to visually represent the category (e.g., 🍔 for Food)
  icon: { 
    type: String 
  }, 

  // Expense category name (e.g., Food, Rent, Groceries)
  category: { 
    type: String, 
    required: true 
  },

  // Amount spent in this expense entry
  amount: { 
    type: Number, 
    required: true 
  },

  // Date of the expense (defaults to current date if not provided)
  date: { 
    type: Date, 
    default: Date.now 
  },
}, { 
  // Automatically create 'createdAt' and 'updatedAt' fields
  timestamps: true 
});

// Export the Expense model to be used in other parts of the application
module.exports = mongoose.model("Expense", ExpenseSchema);
