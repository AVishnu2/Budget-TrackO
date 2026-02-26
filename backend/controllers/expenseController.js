// 📦 Import the xlsx library for Excel file generation
const xlsx = require('xlsx');

// 📄 Import the Expense model to interact with the database
const Expense = require("../models/Expense");

// ➕ Add a new expense for the logged-in user
exports.addExpense = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🧾 Destructure expense details from request body
    const { icon, category, amount, date } = req.body;

    // 🚫 Validate required fields
    if (!category || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🆕 Create a new Expense document
    const newExpense = new Expense({
      userId,              // Associate expense with the current user
      icon,                // Optional icon for category
      category,            // Expense category (e.g., Food, Travel)
      amount,              // Expense amount
      date: new Date(date) // Convert date string to Date object
    });

    // 💾 Save the expense to the database
    await newExpense.save();

    // ✅ Return the saved expense
    res.status(200).json(newExpense);
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};

// 📥 Get all expenses for the logged-in user
exports.getAllExpenses = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🔍 Fetch expenses sorted by date (newest first)
    const expenses = await Expense.find({ userId }).sort({ date: -1 });

    // ✅ Return the list of expenses
    res.json(expenses);
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};

// 🗑️ Delete a specific expense by ID
exports.deleteExpense = async (req, res) => {
  try {
    // 🧹 Find and delete the expense by its ID from request parameters
    await Expense.findByIdAndDelete(req.params.id);

    // ✅ Confirm deletion
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};

// 📤 Download all expenses as an Excel file
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🔍 Fetch all expenses for the user
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    // 📊 Format data for Excel sheet
    const data = expense.map((item) => ({
      Category: item.category, // Expense category
      Amount: item.amount,     // Expense amount
      Date: item.date          // Expense date
    }));

    // 📘 Create a new workbook
    const wb = xlsx.utils.book_new();

    // 📄 Convert JSON data to worksheet
    const ws = xlsx.utils.json_to_sheet(data);

    // 📎 Append worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, "Expense");

    // 💾 Write workbook to file
    xlsx.writeFile(wb, 'expense_details.xlsx');

    // 📥 Send the file for download
    res.download('expense_details.xlsx');
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};