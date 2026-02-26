// 📦 Import the xlsx library to handle Excel file creation
const xlsx = require('xlsx');

// 📄 Import the Income model to interact with the income collection in MongoDB
const Income = require("../models/Income");

// ➕ Add a new income entry for the logged-in user
exports.addIncome = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🧾 Destructure income details from request body
    const { icon, source, amount, date } = req.body;

    // 🚫 Validate required fields
    if (!source || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🆕 Create a new Income document
    const newIncome = new Income({ 
      userId,               // Associate income with the current user
      icon,                 // Optional icon for income source
      source,               // Income source (e.g., Salary, Freelance)
      amount,               // Income amount
      date: new Date(date)  // Convert date string to Date object
    });

    // 💾 Save the income to the database
    await newIncome.save();

    // ✅ Return the saved income entry
    res.status(200).json(newIncome);
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};

// 📥 Get all income entries for the logged-in user
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🔍 Fetch income entries sorted by date (newest first)
    const income = await Income.find({ userId }).sort({ date: -1 });

    // ✅ Return the list of income entries
    res.json(income);
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};

// 🗑️ Delete a specific income entry by ID
exports.deleteIncome = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🧹 Find and delete the income entry by its ID from request parameters
    await Income.findByIdAndDelete(req.params.id);

    // ✅ Confirm deletion
    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};

// 📤 Download all income entries as an Excel file
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id; // 🔐 Extract user ID from the authenticated request

  try {
    // 🔍 Fetch all income entries for the user
    const income = await Income.find({ userId }).sort({ date: -1 });

    // 📊 Format data for Excel sheet
    const data = income.map((item) => ({
      Source: item.source, // Income source
      Amount: item.amount, // Income amount
      Date: item.date      // Income date
    }));

    // 📘 Create a new workbook
    const wb = xlsx.utils.book_new();

    // 📄 Convert JSON data to worksheet
    const ws = xlsx.utils.json_to_sheet(data);

    // 📎 Append worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, "Income");

    // 💾 Write workbook to file
    xlsx.writeFile(wb, 'income_details.xlsx');

    // 📥 Send the file for download
    res.download('income_details.xlsx');
  } catch (error) {
    // ⚠️ Handle server errors
    res.status(500).json({ message: "Server Error" });
  }
};