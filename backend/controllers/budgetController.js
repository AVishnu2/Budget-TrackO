// Import the Budget model to interact with the budget collection in MongoDB
const Budget = require("../models/Budget");

// 📥 Get all budgets for the currently authenticated user
const getBudgets = async (req, res) => {
  try {
    // 🔍 Query the database for budgets belonging to the user
    const budgets = await Budget.find({ user: req.user.id });

    // ✅ Return the list of budgets as JSON
    res.json(budgets);
  } catch (error) {
    // ⚠️ Handle any errors during the fetch operation
    res.status(500).json({ message: "Error fetching budgets", error: error.message });
  }
};

// 💾 Save (replace) budgets for the currently authenticated user
const saveBudgets = async (req, res) => {
  try {
    // 🧾 Extract budgets array from request body
    const { budgets } = req.body;

    // 🧹 Remove all existing budget entries for this user to avoid duplicates
    await Budget.deleteMany({ user: req.user.id });

    // 🆕 Prepare new budget documents with user reference
    const budgetDocs = budgets.map(budget => ({
      user: req.user.id,           // Associate each budget with the current user
      category: budget.category,   // Budget category (e.g., Food, Rent)
      amount: budget.amount        // Budgeted amount for the category
    }));

    // 📤 Insert new budget documents into the database
    const savedBudgets = await Budget.insertMany(budgetDocs);

    // ✅ Return the newly saved budgets as JSON
    res.json(savedBudgets);
  } catch (error) {
    // ⚠️ Handle any errors during the save operation
    res.status(500).json({ message: "Error saving budgets", error: error.message });
  }
};

// 📦 Export the controller functions for use in routes
module.exports = {
  getBudgets,
  saveBudgets
};