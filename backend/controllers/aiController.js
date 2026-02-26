const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const mongoose = require('mongoose');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Allow overriding via env; fallback to a safe default
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"; // temp default
const gemini = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// Helper function to create ObjectId
const createObjectId = (id) => new mongoose.Types.ObjectId(id);

// Simple in-memory cache (TTL: 5 minutes)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.value;
  return null;
}
function setCache(key, value) {
  responseCache.set(key, { value, ts: Date.now() });
}

// Wrapper with retry + exponential backoff on 429 errors
async function generateSafeContent(prompt, retries = 3) {
  const cached = getCached(prompt);
  if (cached) return cached;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await gemini.generateContent(prompt);
      setCache(prompt, result);
      return result;
    } catch (e) {
      if (String(e?.message || e).includes("Not Found")) {
        const fallback = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await fallback.generateContent(prompt);
        setCache(prompt, result);
        return result;
      }
      if (e?.status === 429 && attempt < retries) {
        const waitMs = attempt * 5000;
        console.warn(`Gemini rate limited. Retrying in ${waitMs / 1000}s... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      throw e;
    }
  }
}

// Helper: Check if the question is relevant to financial data
async function checkRelevance(sentence) {
  const prompt = `Determine if the following sentence is relevant to personal finance, budgeting, expenses, income, or financial data analysis. 
  
  RELEVANT topics include:
  - Adding expenses or income
  - Questions about spending, earnings, budgets
  - Financial analysis, trends, patterns
  - Money management, savings, financial goals
  - Transaction history, financial summaries
  
  NOT RELEVANT topics include:
  - General knowledge questions
  - Weather, news, sports, entertainment
  - Technical support, app usage
  - Personal advice unrelated to finances
  - Questions about other people's finances
  
  Sentence: "${sentence}"
  
  Reply with only 'relevant' or 'not_relevant'.`;
  
  const result = await generateSafeContent(prompt);
  return result.response.text().trim().toLowerCase();
}

// Helper: Classify user input as query or add command
async function classifyInput(sentence) {
  const prompt = `Classify the following sentence as either 'add' (if the user wants to add an expense or income) or 'query' (if the user is asking about their finances). Only reply with 'add' or 'query'.\nSentence: "${sentence}"`;
  const result = await generateSafeContent(prompt);
  return result.response.text().trim().toLowerCase();
}

// Helper: Generate a data plan for the query, with few-shot examples
async function generateDataPlan(sentence) {
  const planPrompt = `Given the user's sentence, describe in one sentence what data to fetch from the user's finances (expenses, income, budgets, goals, etc).\nUse the following examples to help you generalize:\n
"I earned ₹10,000 today." => add income ₹10,000 for today\n"Add my salary of ₹25,000." => add income ₹25,000, category salary\n"How much did I earn this month?" => sum all income for current month\n"Show my total income in June." => sum all income for June\n"Which source gave me the most income?" => group income by source, return top\n"I spent ₹300 on groceries." => add expense ₹300, category groceries\n"Add ₹1200 for electricity bill." => add expense ₹1200, category electricity\n"Show my total expenses this month." => sum all expenses for current month\n"How much did I spend on food?" => sum all expenses, category food\n"What's my biggest spending category?" => group expenses by category, return top\n"Are my expenses increasing?" => compare total expenses this month to last month\n"Set a budget of ₹10,000 for groceries this month." => set budget ₹10,000, category groceries, period current month\n"Am I exceeding my grocery budget?" => compare total expenses in groceries to budget for groceries\n"Give me a summary of my finances." => summarize total income, total expenses, balance\n"How much did I save this month?" => income minus expenses for current month\n"Suggest how to reduce expenses." => analyze expenses, suggest categories to cut\n"I want to save ₹50,000 in 6 months — how?" => savings plan for ₹50,000 in 6 months\n"Where is all my money going?" => group expenses by category, show top categories\n"Show me last month." => show summary for last month\n"What's my average monthly expense?" => average expenses per month\n"How much did I spend in the first week of this month?" => sum expenses for first week of current month\n"What can you do?" => list bot capabilities\n"How's my spending vibe?" => analyze spending patterns, give fun feedback\n
Now, for the following sentence, reply with a one-sentence data plan:\nSentence: "${sentence}"`;
  const result = await generateSafeContent(planPrompt);
  return result.response.text().trim();
}

// Helper: Execute the data plan (expanded for spending pattern analysis)
async function executeDataPlan(plan, userId, originalSentence) {
  if (!userId) return { answer: "User not authenticated." };
  
  // Add monthly expense queries
  if (/spend.*this month|expenses.*this month|how much.*spent.*month/i.test(plan) || 
      /spend.*this month|expenses.*this month|how much.*spent.*month/i.test(originalSentence)) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const data = await Expense.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: thisMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return { answer: `You spent ₹${data[0]?.total || 0} this month.`, data };
  }
  
  // Add monthly income queries
  if (/earn.*this month|income.*this month|how much.*earned.*month/i.test(plan) || 
      /earn.*this month|income.*this month|how much.*earned.*month/i.test(originalSentence)) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const data = await Income.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: thisMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return { answer: `You earned ₹${data[0]?.total || 0} this month.`, data };
  }
  
  // Add general expense queries
  if (/what.*expenses|show.*expenses|list.*expenses/i.test(plan) || 
      /what.*expenses|show.*expenses|list.*expenses/i.test(originalSentence)) {
    const data = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return { answer: `Your total expenses are ₹${data[0]?.total || 0}.`, data };
  }
  
  // Add most spent category queries
  if (/most spent|biggest spending|top spending|highest spending/i.test(plan) || 
      /most spent|biggest spending|top spending|highest spending/i.test(originalSentence)) {
    const data = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    if (data.length > 0) {
      return { answer: `Your biggest spending category is ${data[0]._id} with ₹${data[0].total}.`, data };
    } else {
      return { answer: "No expenses found to determine your biggest spending category.", data: [] };
    }
  }

  // 1. Top spending category
  if (/top spending category|most of your money|category you spend the most/i.test(plan)) {
    const data = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    if (data.length > 0) {
      return { answer: `You spend most of your money on ${data[0]._id} (₹${data[0].total}).`, data };
    } else {
      return { answer: "No expenses found to determine top category.", data: [] };
    }
  }
  // 2. Analyze spending patterns (NEW)
  if (/analy[zs]e? (my )?spending patterns|spending habits|spending trend/i.test(plan) || /analy[zs]e? (my )?spending patterns|spending habits|spending trend/i.test(originalSentence)) {
    // Group by category
    const byCategory = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);
    // Group by month
    const byMonth = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }
    ]);
    const data = { byCategory, byMonth };
    return { answer: null, data };
  }
  // 3. Savings comparison: "Did I save more this month than last month?"
  if (/save more this month than last month|savings comparison/i.test(plan) || /save more this month than last month|savings comparison/i.test(originalSentence)) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const thisMonthIncome = await Income.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: thisMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const thisMonthExpense = await Expense.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: thisMonth, $lt: nextMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const lastMonthIncome = await Income.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: lastMonth, $lt: thisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const lastMonthExpense = await Expense.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: lastMonth, $lt: thisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const data = {
      thisMonth: {
        income: thisMonthIncome[0]?.total || 0,
        expense: thisMonthExpense[0]?.total || 0,
        savings: (thisMonthIncome[0]?.total || 0) - (thisMonthExpense[0]?.total || 0)
      },
      lastMonth: {
        income: lastMonthIncome[0]?.total || 0,
        expense: lastMonthExpense[0]?.total || 0,
        savings: (lastMonthIncome[0]?.total || 0) - (lastMonthExpense[0]?.total || 0)
      }
    };
    return { answer: null, data };
  }
  // 4. Compare income and expenses for past 6 months
  if (/compare my income and expenses for the past 6 months|income and expenses for past 6 months/i.test(plan) || /compare my income and expenses for the past 6 months|income and expenses for past 6 months/i.test(originalSentence)) {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ start, end });
    }
    const incomeData = [];
    const expenseData = [];
    for (const m of months) {
      const income = await Income.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const expense = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      incomeData.push({ month: m.start.toISOString().slice(0, 7), total: income[0]?.total || 0 });
      expenseData.push({ month: m.start.toISOString().slice(0, 7), total: expense[0]?.total || 0 });
    }
    const data = { incomeData, expenseData };
    return { answer: null, data };
  }
  // 5. Fastest growing spending category
  if (/category has grown the fastest|fastest growing category/i.test(plan) || /category has grown the fastest|fastest growing category/i.test(originalSentence)) {
    // For each category, get spending for each of the last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ start, end });
    }
    // Get all categories
    const categories = await Expense.distinct("category", { userId: createObjectId(userId) });
    const categoryTrends = {};
    for (const cat of categories) {
      categoryTrends[cat] = [];
      for (const m of months) {
        const sum = await Expense.aggregate([
          { $match: { userId: createObjectId(userId), category: cat, date: { $gte: m.start, $lt: m.end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        categoryTrends[cat].push(sum[0]?.total || 0);
      }
    }
    const data = { categoryTrends, months: months.map(m => m.start.toISOString().slice(0, 7)) };
    return { answer: null, data };
  }
  // 6. Where did I spend the most this year?
  if (/where did i spend the most this year|top spending category this year/i.test(plan) || /where did i spend the most this year|top spending category this year/i.test(originalSentence)) {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const data = await Expense.aggregate([
      { $match: { userId: createObjectId(userId), date: { $gte: yearStart } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]);
    return { answer: null, data };
  }
  // 7. Food spending trend
  if (/food spending changed over time|food spending trend/i.test(plan) || /food spending changed over time|food spending trend/i.test(originalSentence)) {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ start, end });
    }
    const foodTrend = [];
    for (const m of months) {
      const sum = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), category: /food/i, date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      foodTrend.push({ month: m.start.toISOString().slice(0, 7), total: sum[0]?.total || 0 });
    }
    const data = { foodTrend };
    return { answer: null, data };
  }
  // 8. Responsibility trend ("Am I becoming more responsible with money?")
  if (/responsible with money|improving with money|am i on track/i.test(plan) || /responsible with money|improving with money|am i on track/i.test(originalSentence)) {
    // Compare savings (income - expenses) for last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ start, end });
    }
    const savings = [];
    for (const m of months) {
      const income = await Income.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const expense = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      savings.push({ month: m.start.toISOString().slice(0, 7), total: (income[0]?.total || 0) - (expense[0]?.total || 0) });
    }
    const data = { savings };
    return { answer: null, data };
  }
  // 9. Trends in spending: "Show me trends in my spending."
  if (/trends in my spending|spending trend/i.test(plan) || /trends in my spending|spending trend/i.test(originalSentence)) {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ start, end });
    }
    const trend = [];
    for (const m of months) {
      const sum = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      trend.push({ month: m.start.toISOString().slice(0, 7), total: sum[0]?.total || 0 });
    }
    const data = { trend };
    return { answer: null, data };
  }
  // 10. Weekend vs weekday spending: "Am I spending more during weekends?"
  if (/spending more during weekends|weekend spending/i.test(plan) || /spending more during weekends|weekend spending/i.test(originalSentence)) {
    const expenses = await Expense.find({ userId: createObjectId(userId) });
    let weekend = 0, weekday = 0;
    expenses.forEach(e => {
      const day = new Date(e.date).getDay();
      if (day === 0 || day === 6) weekend += e.amount;
      else weekday += e.amount;
    });
    const data = { weekend, weekday };
    return { answer: null, data };
  }
  // 11. Average monthly expense: "What's my average monthly expense?"
  if (/average monthly expense/i.test(plan) || /average monthly expense/i.test(originalSentence)) {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ start, end });
    }
    let total = 0;
    let count = 0;
    const monthly = [];
    for (const m of months) {
      const sum = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const amt = sum[0]?.total || 0;
      monthly.push({ month: m.start.toISOString().slice(0, 7), total: amt });
      total += amt;
      count++;
    }
    const avg = count ? total / count : 0;
    const data = { monthly, average: avg };
    return { answer: null, data };
  }
  // 12. Spending by day of week: "Which day of the week do I spend the most?"
  if (/day of the week do i spend the most|spending by day of week/i.test(plan) || /day of the week do i spend the most|spending by day of week/i.test(originalSentence)) {
    const expenses = await Expense.find({ userId: createObjectId(userId) });
    const days = [0,1,2,3,4,5,6];
    const dayTotals = Array(7).fill(0);
    expenses.forEach(e => {
      const day = new Date(e.date).getDay();
      dayTotals[day] += e.amount;
    });
    const data = { dayTotals };
    return { answer: null, data };
  }
  // 13. Budget improvement this quarter: "Did I improve my budgeting this quarter?"
  // (Assumes you have a Budget model and logic; here is a placeholder)
  if (/improve my budgeting this quarter|budgeting this quarter/i.test(plan) || /improve my budgeting this quarter|budgeting this quarter/i.test(originalSentence)) {
    // Placeholder: compare expenses to budgets for each month in current quarter
    // You can expand this if you have a Budget model
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const months = [];
    for (let i = 0; i < 3; i++) {
      const m = new Date(now.getFullYear(), quarter * 3 + i, 1);
      const next = new Date(now.getFullYear(), quarter * 3 + i + 1, 1);
      months.push({ start: m, end: next });
    }
    const expenses = [];
    for (const m of months) {
      const sum = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), date: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      expenses.push({ month: m.start.toISOString().slice(0, 7), total: sum[0]?.total || 0 });
    }
    // No budget data, so just pass expenses for now
    const data = { expenses };
    return { answer: null, data };
  }
  // 14. Spending after salary credit: "Do I spend more after salary credit?"
  if (/spend more after salary credit|salary credit spending/i.test(plan) || /spend more after salary credit|salary credit spending/i.test(originalSentence)) {
    // Find all salary income dates
    const salaries = await Income.find({ userId: createObjectId(userId), source: /salary/i });
    let afterSalary = 0, other = 0, afterCount = 0, otherCount = 0;
    const expenses = await Expense.find({ userId: createObjectId(userId) });
    for (const s of salaries) {
      // Expenses in 5 days after salary
      const start = new Date(s.date);
      const end = new Date(s.date);
      end.setDate(end.getDate() + 5);
      expenses.forEach(e => {
        if (e.date >= start && e.date < end) {
          afterSalary += e.amount;
          afterCount++;
        }
      });
    }
    // Expenses not after salary
    expenses.forEach(e => {
      let isAfter = false;
      for (const s of salaries) {
        const start = new Date(s.date);
        const end = new Date(s.date);
        end.setDate(end.getDate() + 5);
        if (e.date >= start && e.date < end) {
          isAfter = true;
          break;
        }
      }
      if (!isAfter) {
        other += e.amount;
        otherCount++;
      }
    });
    const data = { afterSalary, afterCount, other, otherCount };
    return { answer: null, data };
  }
  // 3. Recent transactions
  if (/recent transactions|last (\d+) (expenses|incomes)/i.test(plan)) {
    const match = plan.match(/last (\d+) (expenses|incomes)/i);
    const count = match ? parseInt(match[1]) : 5;
    if (/expenses/i.test(plan)) {
      const data = await Expense.find({ userId: createObjectId(userId) }).sort({ date: -1 }).limit(count);
      return { answer: `Here are your last ${count} expenses: ${data.map(e => `${e.category} ₹${e.amount}`).join(", ")}`, data };
    } else {
      const data = await Income.find({ userId: createObjectId(userId) }).sort({ date: -1 }).limit(count);
      return { answer: `Here are your last ${count} incomes: ${data.map(i => `${i.source} ₹${i.amount}`).join(", ")}`, data };
    }
  }
  // 4. Total expenses
  if (/total expenses/i.test(plan)) {
    const data = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return { answer: `Your total expenses are ₹${data[0]?.total || 0}.`, data };
  }
  // 5. Total income
  if (/total income/i.test(plan)) {
    const data = await Income.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return { answer: `Your total income is ₹${data[0]?.total || 0}.`, data };
  }
  // 6. Current balance
  if (/current balance/i.test(plan)) {
    const expenses = await Expense.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const income = await Income.aggregate([
      { $match: { userId: createObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const balance = (income[0]?.total || 0) - (expenses[0]?.total || 0);
    return { answer: `Your current balance is ₹${balance}.`, data: { expenses, income } };
  }
  // 15. Category-specific spending: "How much did I spend on X?"
  const categoryMatch = plan.match(/category ([^\s]+)|on ([^\s]+)|for ([^\s]+)/i);
  if (categoryMatch) {
    // Try to extract the category from the plan or original sentence
    let cat = categoryMatch[1] || categoryMatch[2] || categoryMatch[3];
    if (!cat) {
      // Try to extract from the original sentence
      const sentMatch = originalSentence.match(/on ([^\s]+)|for ([^\s]+)/i);
      cat = sentMatch ? (sentMatch[1] || sentMatch[2]) : null;
    }
    if (cat) {
      // Use case-insensitive, partial match
      const regex = new RegExp(cat, 'i');
      const data = await Expense.aggregate([
        { $match: { userId: createObjectId(userId), category: { $regex: regex } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      if (data.length > 0) {
        return { answer: `You spent ₹${data[0].total} on ${cat}.`, data };
      } else {
        return { answer: `No expenses found for category matching '${cat}'.`, data: [] };
      }
    }
  }
  // 7. Fallback
  return { answer: "Sorry, I can only answer questions about total expenses, total income, current balance, top spending category, or recent transactions for now.", data: [] };
}

exports.parseSentence = async (req, res) => {
  const { sentence } = req.body;
  const userId = req.user?.id || req.user?._id;
  if (!sentence) {
    return res.status(400).json({ error: 'Sentence is required.' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI not configured. Set GEMINI_API_KEY." });
  }
  try {
    // SINGLE Gemini call: does relevance check + intent + extraction all at once
    const classifyPrompt = `You are a financial assistant. Analyze the sentence and respond ONLY with a valid JSON object (no markdown, no code blocks).

Sentence: "${sentence}"

Rules:
- If NOT about personal finance, set isRelevant to false
- If user wants to ADD expense/income: intent="add", fill type/amount/description
- If user is ASKING about their finances: intent="query", fill dataPlan (one-sentence data plan)

Return ONLY this JSON:
{"isRelevant":true/false,"intent":"add"/"query"/"none","type":"expense"/"income"/null,"amount":number/null,"description":"string"/null,"dataPlan":"string"/null}

Examples:
"I spent 500 on food" => {"isRelevant":true,"intent":"add","type":"expense","amount":500,"description":"food","dataPlan":null}
"How much did I spend this month?" => {"isRelevant":true,"intent":"query","type":null,"amount":null,"description":null,"dataPlan":"sum all expenses for current month"}
"How much did I save this month?" => {"isRelevant":true,"intent":"query","type":null,"amount":null,"description":null,"dataPlan":"sum income minus expenses for current month"}
"What's the capital of France?" => {"isRelevant":false,"intent":"none","type":null,"amount":null,"description":null,"dataPlan":null}`;

    const classifyResult = await generateSafeContent(classifyPrompt);
    let rawText = classifyResult.response.text().trim();
    // Strip markdown code blocks if present
    rawText = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let classified;
    try {
      classified = JSON.parse(rawText);
    } catch (e) {
      console.error('Failed to parse AI classification:', rawText);
      return res.status(500).json({ error: 'AI response could not be parsed.', raw: rawText });
    }

    if (!classified.isRelevant) {
      return res.json({
        isRelevant: false,
        answer: "I can only help with financial questions related to your expenses, income, budgets, and financial insights. Please ask me something about your finances!"
      });
    }

    if (classified.intent === 'add') {
      if (!classified.type || !classified.amount || !classified.description) {
        return res.status(500).json({ error: 'AI could not extract all required fields.' });
      }
      return res.json({ ...classified, isRelevant: true });
    }

    if (classified.intent === 'query') {
      const plan = classified.dataPlan || sentence;
      const { answer, data } = await executeDataPlan(plan, userId, sentence);

      let finalAnswer;
      if (answer) {
        finalAnswer = answer;
      } else {
        // Second call only for complex data that needs narration
        const answerPrompt = `Financial data: ${JSON.stringify(data)}. Answer concisely: "${sentence}". Use ₹ for currency. If no data, say so.`;
        const answerResult = await generateSafeContent(answerPrompt);
        finalAnswer = answerResult.response.text().trim();
      }

      return res.json({ answer: finalAnswer, plan, isRelevant: true, data: data || null });
    }

    return res.status(400).json({ error: 'Could not classify input.' });

  } catch (error) {
    console.error('AI Controller Error:', error);
    if (error?.status === 429) {
      return res.status(429).json({ error: 'AI rate limit reached. Please wait a moment and try again.' });
    }
    res.status(500).json({ error: error.message });
  }
}