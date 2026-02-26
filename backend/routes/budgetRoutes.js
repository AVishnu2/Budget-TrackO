const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getBudgets, saveBudgets } = require("../controllers/budgetController");
const router = express.Router();

router.post("/save", protect, saveBudgets);
router.get("/get", protect, getBudgets);

module.exports = router;