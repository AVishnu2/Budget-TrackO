import React, { useEffect, useState, useContext } from "react";
import DashboardLayout from "../../components/Layouts/DashboardLayout";
import { LuHandCoins, LuWalletMinimal } from "react-icons/lu";
import { IoMdCard } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import InfoCard from "../../components/Cards/InfoCard";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";
import RecentIncome from "../../components/Dashboard/RecentIncome";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";
import { UserContext } from "../../context/UserContext";

const Home = () => {
  useUserAuth();
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // OAuth callback handling - runs only once
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        localStorage.setItem("token", token);
        updateUser(userData);
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('OAuth login successful!');
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        navigate('/login?error=oauth_failed');
      }
    }
  }, [updateUser, navigate]);

  const fetchDashboardData = async () => {
    // Prevent multiple simultaneous calls
    if (loading || dataFetched) return;

    setLoading(true);

    try {
      const response = await axiosInstance.get(
        `${API_PATHS.DASHBOARD.GET_DATA}`
      );

      if (response.data) {
        setDashboardData(response.data);
        setDataFetched(true);
      }
    } catch (error) {
      console.log("Something went wrong. Please try again.", error);
      setDataFetched(false); // Allow retry on error
    } finally {
      setLoading(false);
    }
  };

  // Optimized data fetching - only fetch once
  useEffect(() => {
    if (!dataFetched && !loading) {
      fetchDashboardData();
    }
  }, [dataFetched, loading]);

  // Add refresh function for manual refresh
  const refreshData = () => {
    setDataFetched(false);
    setDashboardData(null);
    fetchDashboardData();
  };

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label="Total Balance"
            value={addThousandsSeparator(dashboardData?.totalBalance || 0)}
            color="bg-primary"
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Income"
            value={addThousandsSeparator(dashboardData?.totalIncome || 0)}
            color="bg-orange-500"
          />

          <InfoCard
            icon={<LuHandCoins />}
            label="Total Expenses"
            value={addThousandsSeparator(dashboardData?.totalExpenses || 0)}
            color="bg-red-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <FinanceOverview
            totalBalance={dashboardData?.totalBalance || 0}
            totalIncome={dashboardData?.totalIncome || 0}
            totalExpense={dashboardData?.totalExpenses || 0}
          />

          <ExpenseTransactions
            transactions={dashboardData?.last30DaysExpenses?.transactions || []}
            onSeeMore={() => navigate("/expense")}
          />

          <Last30DaysExpenses
            data={dashboardData?.last30DaysExpenses?.transactions || []}
          />

          <RecentIncomeWithChart
            data={dashboardData?.last60DaysIncome?.transactions?.slice(0,4) || []}
            totalIncome={dashboardData?.totalIncome || 0}
          />

          <RecentIncome
            transactions={dashboardData?.last60DaysIncome?.transactions || []}
            onSeeMore={() => navigate("/income")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;