import React, { useState } from 'react';
import PropTypes from 'prop-types';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

const BudgetManager = ({ budgets = [], onBudgetUpdate }) => {
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editMode, setEditMode] = useState({});
  const [editAmounts, setEditAmounts] = useState({});

  // Default categories
  const defaultCategories = [
    'Food',
    'Groceries',
    'Entertainment',
    'Shopping',
    'Transport',
    'Utilities',
    'Housing',
    'Healthcare'
  ];

  // Get all unique categories (combining default and custom categories)
  // Modify the allCategories to handle undefined budgets
  const allCategories = [...new Set([
    ...defaultCategories,
    ...(budgets || []).map(b => b.category),
  ])];

  const handleEditToggle = (category) => {
    setEditMode(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
    setEditAmounts(prev => ({
      ...prev,
      [category]: getBudgetAmount(category)
    }));
  };

  const getBudgetAmount = (category) => {
    const budget = budgets.find(b => b.category.toLowerCase() === category.toLowerCase());
    return budget ? budget.amount : 0;
  };

  const handleAmountChange = (category, value) => {
    setEditAmounts(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = (category) => {
    const amount = parseFloat(editAmounts[category]);
    if (!isNaN(amount) && amount >= 0) {
      onBudgetUpdate(category, amount);
      setEditMode(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleAddNewCategory = (e) => {
    e.preventDefault();
    if (newCategory.trim() && !isNaN(parseFloat(newAmount)) && parseFloat(newAmount) >= 0) {
      const amount = parseFloat(newAmount);
      onBudgetUpdate(newCategory.trim(), amount);
      setNewCategory('');
      setNewAmount('');
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Budget Manager</h2>
      
      {/* Add New Category Form */}
      <form onSubmit={handleAddNewCategory} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Category</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category Name"
            className="flex-1 p-2 border rounded-md"
            required
          />
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Budget Amount"
            min="0"
            step="1"
            className="flex-1 p-2 border rounded-md"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Add Category
          </button>
        </div>
      </form>

      {/* Existing Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCategories.map((category) => (
          <div key={category} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">{category}</h3>
              <button
                onClick={() => handleEditToggle(category)}
                className="text-blue-600 hover:text-blue-800"
              >
                {editMode[category] ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editMode[category] ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editAmounts[category]}
                  onChange={(e) => handleAmountChange(category, e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  min="0"
                  step="1"
                />
                <button
                  onClick={() => handleSave(category)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-gray-600">
                Budget: {formatCurrency(getBudgetAmount(category))}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

BudgetManager.propTypes = {
  budgets: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired
    })
  ).isRequired,
  onBudgetUpdate: PropTypes.func.isRequired
};

export default BudgetManager;