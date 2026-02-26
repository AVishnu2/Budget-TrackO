const express = require("express");
const {
  addExpense,
  getAllExpenses,
  deleteExpense,
  downloadExpenseExcel,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Add async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/add", protect, asyncHandler(addExpense));
router.get("/get", protect, asyncHandler(getAllExpenses));
router.get("/downloadexcel", protect, asyncHandler(downloadExpenseExcel));
router.delete("/:id", protect, asyncHandler(deleteExpense));

module.exports = router;