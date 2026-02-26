import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import BudgetManager from '../../components/Budget/BudgetManager';
import Save from '../../components/Save/Save';
import { useUserAuth } from '../../hooks/useUserAuth';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

const SmartBudget = () => {
  useUserAuth();
  const [budgets, setBudgets] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get All Expense Details
  const fetchExpenseDetails = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get(`${API_PATHS.EXPENSE.GET_ALL_EXPENSE}`);
      if (response.data) {
        setExpenseData(response.data);
      }
    } catch (error) {
      console.log("Something went wrong. Please try again.", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved budgets
  const fetchBudgets = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/budget/get');
      if (response.data) {
        setBudgets(response.data);
      }
    } catch (error) {
      console.log("Error fetching budgets", error);
    }
  };

  // Save budgets to backend
  const saveBudgets = async (updatedBudgets) => {
    try {
      await axiosInstance.post('/api/v1/budget/save', { budgets: updatedBudgets });
      setBudgets(updatedBudgets);
    } catch (error) {
      console.log("Error saving budgets", error);
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
    fetchBudgets(); // Fetch initial budgets
    return () => {};
  }, []);

  const handleBudgetUpdate = (category, amount) => {
    // Find if the category already exists
    const updatedBudgets = [...budgets];
    const existingIndex = updatedBudgets.findIndex(
      b => b.category.toLowerCase() === category.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing category
      updatedBudgets[existingIndex] = {
        ...updatedBudgets[existingIndex],
        amount: amount
      };
    } else {
      // Add new category
      updatedBudgets.push({
        category: category,
        amount: amount
      });
    }

    saveBudgets(updatedBudgets);
  };

  return (
    <DashboardLayout activeMenu="smartbudget">
      <div className="grid grid-cols-1 gap-6">
        <BudgetManager budgets={budgets} onBudgetUpdate={handleBudgetUpdate} />
        <Save expenses={expenseData} budgets={budgets} />
      </div>
    </DashboardLayout>
  );
};

export default SmartBudget;