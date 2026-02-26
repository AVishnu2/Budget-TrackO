import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { 
  FaPlus, FaTrash, FaLightbulb, FaExclamationTriangle, 
  FaCheckCircle, FaInfoCircle, FaChartBar, FaSync 
} from 'react-icons/fa';

const EnhancedBudgetPlanner = () => {
  const [budgets, setBudgets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBudgets(),
        fetchInsights(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.BUDGET.GET_BUDGETS, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.BUDGET.GET_INSIGHTS, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.BUDGET.GET_CATEGORIES);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddBudget = () => {
    const availableCategories = categories.filter(
      cat => !budgets.find(budget => budget.category === cat.name)
    );

    if (availableCategories.length === 0) {
      toast.error('All categories already have budgets');
      return;
    }

    const newBudget = {
      category: availableCategories[0].name,
      amount: 0,
      description: ''
    };

    setBudgets([...budgets, newBudget]);
  };

  const handleRemoveBudget = (index) => {
    const newBudgets = budgets.filter((_, i) => i !== index);
    setBudgets(newBudgets);
  };

  const handleBudgetChange = (index, field, value) => {
    const newBudgets = [...budgets];
    newBudgets[index][field] = value;
    setBudgets(newBudgets);
  };

  const handleSaveBudgets = async () => {
    setSaving(true);
    try {
      const validBudgets = budgets.filter(budget => 
        budget.category && budget.amount > 0
      );

      if (validBudgets.length === 0) {
        toast.error('Please add at least one valid budget');
        return;
      }

      await axiosInstance.post(API_PATHS.BUDGET.SAVE_BUDGETS, {
        budgets: validBudgets,
        month: selectedMonth,
        year: selectedYear
      });

      toast.success('Budgets saved successfully!');
      await fetchInsights(); // Refresh insights after saving
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast.error('Failed to save budgets');
    } finally {
      setSaving(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'error': return <FaExclamationTriangle className="text-red-500" />;
      case 'warning': return <FaExclamationTriangle className="text-orange-500" />;
      case 'success': return <FaCheckCircle className="text-green-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getCategoryInfo = (categoryName) => {
    return categories.find(cat => cat.name === categoryName) || 
           { icon: '💰', color: '#6B7280' };
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaChartBar className="text-2xl text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Smart Budget Planner</h2>
              <p className="text-sm text-gray-600">AI-powered insights and category matching</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - 2 + i}>
                  {new Date().getFullYear() - 2 + i}
                </option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </div>

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              Smart Insights
            </h3>
            
            <div className="space-y-3">
              <AnimatePresence>
                {insights.slice(0, 5).map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'error' ? 'bg-red-50 border-red-500' :
                      insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                      insight.type === 'success' ? 'bg-green-50 border-green-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{insight.message}</p>
                        {insight.data?.percentageUsed !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Budget Usage</span>
                              <span>{insight.data.percentageUsed}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  getProgressColor(insight.data.percentageUsed)
                                }`}
                                style={{ width: `${Math.min(insight.data.percentageUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Budget Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Budget Categories</h3>
            <button
              onClick={handleAddBudget}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <FaPlus className="text-xs" />
              Add Category
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {budgets.map((budget, index) => {
                const categoryInfo = getCategoryInfo(budget.category);
                const insight = insights.find(i => i.category === budget.category);
                
                return (
                  <motion.div
                    key={`${budget.category}_${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${categoryInfo.color}20` }}
                      >
                        {categoryInfo.icon}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                          value={budget.category}
                          onChange={(e) => handleBudgetChange(index, 'category', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {categories.map(category => (
                            <option key={category.name} value={category.name}>
                              {category.icon} {category.name}
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          placeholder="Budget Amount"
                          value={budget.amount}
                          onChange={(e) => handleBudgetChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={budget.description || ''}
                          onChange={(e) => handleBudgetChange(index, 'description', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      
                      <button
                        onClick={() => handleRemoveBudget(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>

                    {/* Progress Bar for existing budgets with insights */}
                    {insight && insight.data && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Spent: ₹{insight.data.totalSpent}</span>
                          <span>Remaining: ₹{insight.data.remaining}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              getProgressColor(insight.data.percentageUsed)
                            }`}
                            style={{ width: `${Math.min(insight.data.percentageUsed, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {insight.data.percentageUsed}% used
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {budgets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FaChartBar className="text-4xl mx-auto mb-3 opacity-50" />
              <p>No budgets set for this month</p>
              <p className="text-sm">Add your first budget category to get started</p>
            </div>
          )}
        </div>

        {/* Save Button */}
        {budgets.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveBudgets}
              disabled={saving}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Budgets'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedBudgetPlanner;
