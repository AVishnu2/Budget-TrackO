import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// Utility function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Move getSavingTip function definition before it's used
const getSavingTip = (category) => {
  const tips = {
    food: "Consider meal prepping and buying groceries in bulk. Cook more meals at home.",
    groceries: "Make a shopping list, use coupons, and buy generic brands when possible.",
    entertainment: "Look for free local events and activities. Use streaming services instead of multiple subscriptions.",
    shopping: "Wait for sales, compare prices online, and consider second-hand options.",
    transport: "Use public transportation, carpool, or consider walking/cycling for short distances.",
    utilities: "Install energy-efficient appliances and be mindful of energy consumption.",
    housing: "Consider a roommate or negotiate rent. Minimize additional housing expenses.",
    healthcare: "Look for preventive care options and compare insurance plans.",
    default: "Track your spending regularly and identify areas where you can cut back."
  };
  return tips[category.toLowerCase()] || tips.default;
};

// Component for displaying saving suggestions based on budget analysis
const Save = ({ expenses, budgets }) => {
  // Memoized suggestions to prevent unnecessary recalculations
  const suggestions = useMemo(() => {
    // Group expenses by category (case-insensitive)
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category.toLowerCase();
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {});

    // Generate suggestions for categories exceeding budget
    return budgets.reduce((suggestions, budget) => {
      const category = budget.category.toLowerCase();
      const spent = expensesByCategory[category] || 0;
      const budgetAmount = budget.amount;
      
      // Only proceed if there's actual spending in this category
      if (spent > 0) {
        // Calculate how much is over budget
        const overspentAmount = Math.max(0, spent - budgetAmount);
        const overspendingPercentage = Math.round((overspentAmount / budgetAmount) * 100);

        // Only show suggestions if over budget
        if (overspentAmount > 0) {
          suggestions.push({
            category: budget.category,
            spent,
            budgetAmount,
            overspentAmount,
            overspendingPercentage,
            tip: getSavingTip(category),
            // Suggest saving the overspent amount plus 10% of budget
            estimatedSavings: Math.round(overspentAmount + (budgetAmount * 0.1))
          });
        }
      }
      return suggestions;
    }, []);
  }, [expenses, budgets]);

  // Rest of the component remains the same
  return (
    <div className="w-full p-4 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Savings Suggestions
      </h2>
      
      {suggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion, index) => (
            <div 
              key={`suggestion-${index}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-red-50 p-4 border-b border-red-100">
                <h3 className="text-lg font-semibold text-red-700">
                  {suggestion.category}
                </h3>
                <p className="text-red-600 mt-1 text-sm">
                  {suggestion.overspendingPercentage}% over budget
                </p>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="text-gray-600 text-sm space-y-1">
                  <p>Spent: {formatCurrency(suggestion.spent)}</p>
                  <p>Budget: {formatCurrency(suggestion.budgetAmount)}</p>
                  <p>Over by: {formatCurrency(suggestion.overspentAmount)}</p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-gray-700 text-sm">
                    <span className="font-medium">Tip:</span> {suggestion.tip}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-green-700 font-medium text-sm">
                    Potential monthly savings: {formatCurrency(suggestion.estimatedSavings)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <p className="text-green-700 font-medium">
            Great job! 🎉 Your spending is within budget across all categories.
          </p>
          <p className="text-green-600 text-sm mt-2">
            Keep maintaining these good financial habits!
          </p>
        </div>
      )}
    </div>
  );
};

// PropTypes for type checking
Save.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired
    })
  ).isRequired,
  budgets: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired
    })
  ).isRequired
};

export default Save;