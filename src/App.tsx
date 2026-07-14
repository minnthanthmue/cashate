/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  User, 
  Transaction, 
  SavingsGoal, 
  EXPENSE_CATEGORIES, 
  INCOME_CATEGORIES, 
  CURRENCIES, 
  EXCHANGE_RATES 
} from "./types";
import { useAuth } from "./context/AuthContext";
import { convertCurrency, formatCurrencyValue, getCurrencySymbol } from "./utils";
import LoginScreen from "./components/LoginScreen";
import Logo from "./components/Logo";
import LucideIcon from "./components/LucideIcon";
import { GlassEffect, GlassFilter } from "./components/GlassEffect";
import { motion } from "motion/react";

// Seed data generator for first-time users
const SEED_TRANSACTIONS = (currency: string, userId: string): Transaction[] => {
  const now = new Date();
  const formatOffsetDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  return [
    {
      id: "tx-1",
      userId: userId,
      type: "income",
      amount: convertCurrency(350000, "JPY", currency),
      category: "Salary",
      date: formatOffsetDate(2),
      note: "Monthly base salary payout",
      currency: currency
    },
    {
      id: "tx-2",
      userId: userId,
      type: "expense",
      amount: convertCurrency(12400, "JPY", currency),
      category: "Food",
      date: formatOffsetDate(0),
      note: "Premium sushi dinner",
      currency: currency
    },
    {
      id: "tx-3",
      userId: userId,
      type: "expense",
      amount: convertCurrency(4200, "JPY", currency),
      category: "Transportation",
      date: formatOffsetDate(3),
      note: "Weekly subway commute pass",
      currency: currency
    },
    {
      id: "tx-4",
      userId: userId,
      type: "expense",
      amount: convertCurrency(85000, "JPY", currency),
      category: "Housing/Rent",
      date: formatOffsetDate(10),
      note: "Apartment rental",
      currency: currency
    },
    {
      id: "tx-5",
      userId: userId,
      type: "expense",
      amount: convertCurrency(6200, "JPY", currency),
      category: "Utilities",
      date: formatOffsetDate(5),
      note: "Electricity bill",
      currency: currency
    },
    {
      id: "tx-6",
      userId: userId,
      type: "income",
      amount: convertCurrency(25000, "JPY", currency),
      category: "Freelance",
      date: formatOffsetDate(8),
      note: "Logo design draft payment",
      currency: currency
    },
    {
      id: "tx-7",
      userId: userId,
      type: "expense",
      amount: convertCurrency(15000, "JPY", currency),
      category: "Shopping",
      date: formatOffsetDate(12),
      note: "Mechanical keyboard keys",
      currency: currency
    },
    // Add older ones for previous period trend comparisons
    {
      id: "tx-old-1",
      userId: userId,
      type: "expense",
      amount: convertCurrency(90000, "JPY", currency),
      category: "Housing/Rent",
      date: formatOffsetDate(35),
      note: "Prior month apartment rental",
      currency: currency
    },
    {
      id: "tx-old-2",
      userId: userId,
      type: "expense",
      amount: convertCurrency(18000, "JPY", currency),
      category: "Food",
      date: formatOffsetDate(38),
      note: "Prior month catering groceries",
      currency: currency
    },
    {
      id: "tx-old-3",
      userId: userId,
      type: "income",
      amount: convertCurrency(340000, "JPY", currency),
      category: "Salary",
      date: formatOffsetDate(32),
      note: "Prior month base salary payout",
      currency: currency
    }
  ];
};

const SEED_GOALS = (currency: string, userId: string): SavingsGoal[] => {
  return [
    {
      id: "goal-1",
      userId: userId,
      name: "New Laptop",
      targetAmount: convertCurrency(250000, "JPY", currency),
      currentAmount: convertCurrency(180000, "JPY", currency),
      targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 15).toISOString().split("T")[0],
      currency: currency
    },
    {
      id: "goal-2",
      userId: userId,
      name: "Emergency Fund",
      targetAmount: convertCurrency(1000000, "JPY", currency),
      currentAmount: convertCurrency(350000, "JPY", currency),
      targetDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0],
      currency: currency
    }
  ];
};

export default function App() {
  const { user: firebaseUser, loading, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  
  // Navigation: "home" | "goals" | "reports" | "transactions_list" | "add_transaction" | "settings"
  const [currentView, setCurrentView] = useState<"home" | "goals" | "reports" | "transactions_list" | "add_transaction" | "settings">("home");
  
  // Editing contexts
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Quick action overlays
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState<SavingsGoal | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState<string>("");
  const [showResetConfirmationModal, setShowResetConfirmationModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Report variables
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [reportOffset, setReportOffset] = useState<number>(0); // 0 = current, -1 = previous, etc.
  const [aiInsights, setAiInsights] = useState<{ summary: string; suggestedTips: string[] } | null>(null);
  const [isLoadingAiInsights, setIsLoadingAiInsights] = useState(false);

  // Form states for Add / Edit Transaction
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState<string>("");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [txNote, setTxNote] = useState<string>("");
  const [txIsSplit, setTxIsSplit] = useState<boolean>(false);
  const [txParticipantNames, setTxParticipantNames] = useState<string>("");
  const [txSplitType, setTxSplitType] = useState<"equal" | "manual">("equal");
  const [txYourShare, setTxYourShare] = useState<string>("");

  // Form states for Add / Edit Savings Goal
  const [goalName, setGoalName] = useState<string>("");
  const [goalTargetAmount, setGoalTargetAmount] = useState<string>("");
  const [goalCurrentAmount, setGoalCurrentAmount] = useState<string>("0");
  const [goalTargetDate, setGoalTargetDate] = useState<string>("");

  // Transaction Filters / Sorting
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  // Load user data on auth state change
  useEffect(() => {
    if (firebaseUser) {
      const users = JSON.parse(localStorage.getItem("cash_ate_users") || "{}");
      let currentUser = users[firebaseUser.email!];
      
      if (!currentUser) {
        currentUser = {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
          preferredCurrency: "JPY",
          authProvider: "email",
          isFirstLogin: true,
        };
        users[firebaseUser.email!] = currentUser;
        localStorage.setItem("cash_ate_users", JSON.stringify(users));
      }
      
      setUser(currentUser);
      loadUserData(currentUser);
    } else {
      setUser(null);
      setTransactions([]);
      setSavingsGoals([]);
    }
  }, [firebaseUser]);

  // Auto-dismiss success notifications
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  // Dynamic dark theme toggling
  useEffect(() => {
    const root = window.document.documentElement;
    const pref = user?.themePreference || "system";
    
    const applyTheme = (theme: "light" | "dark") => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (pref === "dark") {
      applyTheme("dark");
    } else if (pref === "light") {
      applyTheme("light");
    } else {
      // System selection
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(systemDark ? "dark" : "light");

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [user?.themePreference]);

  const loadUserData = (currentUser: User) => {
    // Load or seed transactions - default starts from zero!
    const storedTx = localStorage.getItem(`cash_ate_tx_${currentUser.email}`);
    let loadedTx: Transaction[] = [];
    if (storedTx) {
      loadedTx = JSON.parse(storedTx);
      // Data isolation mapping and filtering (existing users get migrated with userId)
      loadedTx = loadedTx.map(t => ({
        ...t,
        userId: t.userId || currentUser.email
      })).filter(t => t.userId === currentUser.email);
    } else {
      loadedTx = [];
      localStorage.setItem(`cash_ate_tx_${currentUser.email}`, JSON.stringify(loadedTx));
    }
    setTransactions(loadedTx);

    // Load or seed goals - default starts from zero!
    const storedGoals = localStorage.getItem(`cash_ate_goals_${currentUser.email}`);
    let loadedGoals: SavingsGoal[] = [];
    if (storedGoals) {
      loadedGoals = JSON.parse(storedGoals);
      // Data isolation mapping and filtering (existing users get migrated with userId)
      loadedGoals = loadedGoals.map(g => ({
        ...g,
        userId: g.userId || currentUser.email
      })).filter(g => g.userId === currentUser.email);
    } else {
      loadedGoals = [];
      localStorage.setItem(`cash_ate_goals_${currentUser.email}`, JSON.stringify(loadedGoals));
    }
    setSavingsGoals(loadedGoals);
  };


  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setTransactions([]);
    setSavingsGoals([]);
    setCurrentView("home");
  };

  const handleClearAllData = () => {
    if (!user) return;
    setTransactions([]);
    setSavingsGoals([]);
    localStorage.setItem(`cash_ate_tx_${user.email}`, JSON.stringify([]));
    localStorage.setItem(`cash_ate_goals_${user.email}`, JSON.stringify([]));
    
    // Clear user-specific budget limit setting
    const updatedUser = { ...user, monthlyBudgetLimit: undefined };
    setUser(updatedUser);
    localStorage.setItem("cash_ate_current_user", JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem("cash_ate_users") || "{}");
    if (users[user.email]) {
      users[user.email] = updatedUser;
      localStorage.setItem("cash_ate_users", JSON.stringify(users));
    }

    setShowResetConfirmationModal(false);
    setSuccessNotification("All your data (transactions, budgets, and goals) has been successfully deleted.");
  };

  const handleLoadDemoData = () => {
    if (!user) return;
    const demoTx = SEED_TRANSACTIONS(user.preferredCurrency, user.email);
    const demoGoals = SEED_GOALS(user.preferredCurrency, user.email);
    setTransactions(demoTx);
    setSavingsGoals(demoGoals);
    localStorage.setItem(`cash_ate_tx_${user.email}`, JSON.stringify(demoTx));
    localStorage.setItem(`cash_ate_goals_${user.email}`, JSON.stringify(demoGoals));
  };

  // Sync to local storage on changes with strict filtering to ensure isolation
  const saveTransactions = (newTxList: Transaction[]) => {
    if (!user) return;
    const isolatedTx = newTxList
      .map(t => ({ ...t, userId: t.userId || user.email }))
      .filter(t => t.userId === user.email);
    setTransactions(isolatedTx);
    localStorage.setItem(`cash_ate_tx_${user.email}`, JSON.stringify(isolatedTx));
  };

  const saveGoals = (newGoalsList: SavingsGoal[]) => {
    if (!user) return;
    const isolatedGoals = newGoalsList
      .map(g => ({ ...g, userId: g.userId || user.email }))
      .filter(g => g.userId === user.email);
    setSavingsGoals(isolatedGoals);
    localStorage.setItem(`cash_ate_goals_${user.email}`, JSON.stringify(isolatedGoals));
  };

  // Convert transaction arrays safely to user's currency for uniform stats
  const getConvertedTransactions = (): Transaction[] => {
    if (!user) return [];
    return transactions.map(t => {
      const convertedAmount = convertCurrency(t.amount, t.currency, user.preferredCurrency);
      return {
        ...t,
        amount: convertedAmount,
        currency: user.preferredCurrency
      };
    });
  };

  // Convert goals safely to user's currency
  const getConvertedGoals = (): SavingsGoal[] => {
    if (!user) return [];
    return savingsGoals.map(g => {
      const convertedTarget = convertCurrency(g.targetAmount, g.currency, user.preferredCurrency);
      const convertedCurrent = convertCurrency(g.currentAmount, g.currency, user.preferredCurrency);
      return {
        ...g,
        targetAmount: convertedTarget,
        currentAmount: convertedCurrent,
        currency: user.preferredCurrency
      };
    });
  };

  // Calculations for current period statistics (Month summary)
  const getMonthStats = () => {
    const converted = getConvertedTransactions();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const currentMonthTx = converted.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    });

    const income = currentMonthTx
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTx
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      txCount: currentMonthTx.length
    };
  };

  // Calculate expense breakdown by category for the current month
  const getCategoryBreakdown = () => {
    const converted = getConvertedTransactions();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthExpenses = converted.filter(t => {
      const tDate = new Date(t.date);
      return t.type === "expense" && tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    });

    const categoriesMap: Record<string, number> = {};
    let totalExpensesSum = 0;

    currentMonthExpenses.forEach(t => {
      categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
      totalExpensesSum += t.amount;
    });

    return Object.entries(categoriesMap).map(([category, amount]) => {
      const categoryInfo = EXPENSE_CATEGORIES.find(c => c.name === category) || {
        name: category,
        color: "#9CA3AF",
        borderColor: "border-gray-400"
      };
      return {
        category,
        amount,
        percentage: totalExpensesSum > 0 ? (amount / totalExpensesSum) * 100 : 0,
        color: categoryInfo.color
      };
    }).sort((a, b) => b.amount - a.amount);
  };

  // Handle adding/editing transaction
  const startAddTransaction = () => {
    setEditingTransaction(null);
    setTxType("expense");
    setTxCategory(EXPENSE_CATEGORIES[0].name);
    setTxAmount("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxNote("");
    setTxIsSplit(false);
    setTxParticipantNames("");
    setTxSplitType("equal");
    setTxYourShare("");
    setCurrentView("add_transaction");
  };

  const startEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxAmount(tx.amount.toString());
    setTxDate(tx.date);
    setTxNote(tx.note || "");
    setTxIsSplit(tx.isSplit || false);
    setTxParticipantNames(tx.splitWith ? tx.splitWith.join(", ") : "");
    setTxSplitType(tx.yourShare !== undefined && Math.abs(tx.yourShare - tx.amount / ((tx.splitWith?.length || 0) + 1)) > 0.01 ? "manual" : "equal");
    setTxYourShare(tx.yourShare !== undefined ? tx.yourShare.toString() : "");
    setCurrentView("add_transaction");
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a positive amount.");
      return;
    }

    if (!txCategory) {
      alert("Please choose a category.");
      return;
    }

    let isSplitVal = false;
    let splitWithVal: string[] | undefined = undefined;
    let yourShareVal: number | undefined = undefined;

    if (txType === "expense" && txIsSplit) {
      isSplitVal = true;
      const names = txParticipantNames.split(",").map(s => s.trim()).filter(Boolean);
      splitWithVal = names.length > 0 ? names : ["Participant"];
      
      if (txSplitType === "equal") {
        yourShareVal = amountNum / (splitWithVal.length + 1);
      } else {
        const manualShareNum = parseFloat(txYourShare);
        if (isNaN(manualShareNum) || manualShareNum <= 0 || manualShareNum > amountNum) {
          alert("Your share cannot be more than the total amount.");
          return;
        }
        yourShareVal = manualShareNum;
      }
    }

    if (editingTransaction) {
      // Edit mode
      const updatedList = transactions.map(t => {
        if (t.id === editingTransaction.id) {
          return {
            ...t,
            userId: user.email,
            type: txType,
            amount: amountNum,
            category: txCategory,
            date: txDate,
            note: txNote,
            // Keep original currency or default to current user preference
            currency: t.currency || user.preferredCurrency,
            isSplit: isSplitVal,
            splitWith: splitWithVal,
            yourShare: yourShareVal
          };
        }
        return t;
      });
      saveTransactions(updatedList);
    } else {
      // Add mode
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        userId: user.email,
        type: txType,
        amount: amountNum,
        category: txCategory,
        date: txDate,
        note: txNote,
        currency: user.preferredCurrency,
        isSplit: isSplitVal,
        splitWith: splitWithVal,
        yourShare: yourShareVal
      };
      saveTransactions([newTx, ...transactions]);
    }

    setEditingTransaction(null);
    setCurrentView("home");
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setTransactionToDelete(tx);
      setDeleteError(null);
    }
  };

  const confirmDeleteTransaction = () => {
    if (!transactionToDelete) return;
    try {
      if (!user) {
        throw new Error("You must be logged in to delete a transaction.");
      }
      if (transactionToDelete.userId !== user.email) {
        throw new Error("You are not authorized to delete this transaction.");
      }
      const filtered = transactions.filter(t => t.id !== transactionToDelete.id);
      saveTransactions(filtered);
      setTransactionToDelete(null);
      setDeleteError(null);
      setSuccessNotification("Transaction deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete transaction:", err);
      setDeleteError(err?.message || "An unexpected error occurred.");
    }
  };

  // Handle Savings Goals actions
  const startAddGoal = () => {
    setEditingGoal(null);
    setGoalName("");
    setGoalTargetAmount("");
    setGoalCurrentAmount("0");
    setGoalTargetDate("");
    setShowAddGoalModal(true);
  };

  const startEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTargetAmount(goal.targetAmount.toString());
    setGoalCurrentAmount(goal.currentAmount.toString());
    setGoalTargetDate(goal.targetDate || "");
    setShowAddGoalModal(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const targetNum = parseFloat(goalTargetAmount);
    const currentNum = parseFloat(goalCurrentAmount || "0");

    if (isNaN(targetNum) || targetNum <= 0) {
      alert("Please enter a valid positive target amount.");
      return;
    }

    if (isNaN(currentNum) || currentNum < 0) {
      alert("Please enter a valid positive current amount.");
      return;
    }

    if (!goalName.trim()) {
      alert("Please enter a goal name.");
      return;
    }

    if (editingGoal) {
      const updated = savingsGoals.map(g => {
        if (g.id === editingGoal.id) {
          return {
            ...g,
            userId: user.email,
            name: goalName,
            targetAmount: targetNum,
            currentAmount: currentNum,
            targetDate: goalTargetDate || undefined,
            currency: g.currency || user.preferredCurrency
          };
        }
        return g;
      });
      saveGoals(updated);
    } else {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}`,
        userId: user.email,
        name: goalName,
        targetAmount: targetNum,
        currentAmount: currentNum,
        targetDate: goalTargetDate || undefined,
        currency: user.preferredCurrency
      };
      saveGoals([...savingsGoals, newGoal]);
    }

    setShowAddGoalModal(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      const filtered = savingsGoals.filter(g => g.id !== id);
      saveGoals(filtered);
    }
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddFundsModal) return;

    const topUp = parseFloat(addFundsAmount);
    if (isNaN(topUp) || topUp <= 0) {
      alert("Please enter an amount to add.");
      return;
    }

    const updated = savingsGoals.map(g => {
      if (g.id === showAddFundsModal.id) {
        return {
          ...g,
          currentAmount: g.currentAmount + topUp
        };
      }
      return g;
    });

    saveGoals(updated);
    setShowAddFundsModal(null);
    setAddFundsAmount("");
  };

  // Helper for generating custom reports periods
  const getPeriodStartAndEnd = (type: "daily" | "weekly" | "monthly", offset: number) => {
    const start = new Date();
    const end = new Date();

    if (type === "daily") {
      start.setDate(start.getDate() + offset);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + offset);
      end.setHours(23, 59, 59, 999);
    } else if (type === "weekly") {
      // Find previous Monday (or current if Mon)
      const day = start.getDay();
      const diffToMonday = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diffToMonday + (offset * 7));
      start.setHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Monthly
      start.setMonth(start.getMonth() + offset);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const getPriorPeriodStartAndEnd = (type: "daily" | "weekly" | "monthly", offset: number) => {
    // A same-length period prior to the current offsets
    return getPeriodStartAndEnd(type, offset - (type === "daily" ? 1 : type === "weekly" ? 1 : 1));
  };

  // Get report transactions filtered by type and date
  const getReportTransactions = (type: "daily" | "weekly" | "monthly", offset: number) => {
    const { start, end } = getPeriodStartAndEnd(type, offset);
    const converted = getConvertedTransactions();

    return converted.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  };

  const getPriorPeriodTransactions = (type: "daily" | "weekly" | "monthly", offset: number) => {
    const { start, end } = getPriorPeriodStartAndEnd(type, offset);
    const converted = getConvertedTransactions();

    return converted.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  };

  // Generate Smart Spending Insights using built-in offline logic and calculations
  const calculateSmartInsights = (
    currentTx: any[],
    priorTx: any[],
    periodType: "daily" | "weekly" | "monthly",
    preferredCurrency: string,
    goals: any[]
  ) => {
    const currentExpenses = currentTx.filter(t => t.type === "expense");
    const currentIncomes = currentTx.filter(t => t.type === "income");
    
    const totalExpense = currentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = currentIncomes.reduce((sum, t) => sum + t.amount, 0);

    const priorExpenses = priorTx.filter(t => t.type === "expense");
    const totalPriorExpense = priorExpenses.reduce((sum, t) => sum + t.amount, 0);

    if (currentTx.length === 0) {
      return {
        summary: "You do not have any logged transactions for this period. Add income or expense entries to see your financial insights.",
        suggestedTips: [
          "Tracking everyday expenses is the secret to strong financial discipline.",
          "Add a savings goal to automatically monitor progress and budget contributions.",
          "Set up regular income entries to accurately track your savings rate."
        ]
      };
    }

    // 1. Highest Spending Category
    const catSums: { [cat: string]: number } = {};
    currentExpenses.forEach(t => {
      const cat = t.category || "Uncategorized";
      catSums[cat] = (catSums[cat] || 0) + t.amount;
    });

    let highestCat = "";
    let highestCatAmt = 0;
    Object.entries(catSums).forEach(([cat, amt]) => {
      if (amt > highestCatAmt) {
        highestCatAmt = amt;
        highestCat = cat;
      }
    });

    // 2. Daily Average Spending
    let daysInPeriod = 30;
    if (periodType === "daily") daysInPeriod = 1;
    else if (periodType === "weekly") daysInPeriod = 7;
    const dailyAverage = totalExpense / daysInPeriod;

    // 3. Weekend Spending
    let weekendExpense = 0;
    currentExpenses.forEach(t => {
      try {
        const d = new Date(t.date);
        const day = d.getDay(); // 0 is Sunday, 6 is Saturday
        if (day === 0 || day === 6) {
          weekendExpense += t.amount;
        }
      } catch (e) {
        // Safe fallback for date parsing issues
      }
    });
    const weekendPct = totalExpense > 0 ? (weekendExpense / totalExpense) * 100 : 0;

    const sentences: string[] = [];
    const periodName = periodType === "monthly" ? "this month" : periodType === "weekly" ? "this week" : "today";
    const priorPeriodName = periodType === "monthly" ? "last month" : periodType === "weekly" ? "last week" : "yesterday";

    // Sentence 1: Income vs Expenses & Savings Rates
    if (totalIncome > 0) {
      if (totalIncome > totalExpense) {
        sentences.push(`Your income is higher than your expenses ${periodName}.`);
      } else {
        const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
        sentences.push(`Your expenses exceeded your income ${periodName}, resulting in a negative savings rate of ${savingsRate.toFixed(0)}%.`);
      }
    } else {
      sentences.push(`You recorded a total of ${formatCurrencyValue(totalExpense, preferredCurrency)} in expenses ${periodName}.`);
    }

    // Sentence 2: Highest spending category / Weekend spending / Budget limit
    const budgetLimit = user?.monthlyBudgetLimit || (user?.preferredCurrency === "JPY" ? 150000 : user?.preferredCurrency === "USD" ? 1000 : user?.preferredCurrency === "EUR" ? 1000 : 800);
    const budgetPct = Math.round((totalExpense / budgetLimit) * 100);

    if (budgetPct >= 75) {
      sentences.push(`You have used ${budgetPct}% of your budget.`);
    } else if (highestCat) {
      sentences.push(`${highestCat} is your highest spending category ${periodName}.`);
    } else if (currentExpenses.length > 1 && weekendPct > 50) {
      sentences.push(`Most of your expenses happened during the weekend.`);
    }

    // Sentence 3: Spending Trend comparison (WoW / MoM)
    if (totalPriorExpense > 0) {
      const diffExpense = totalExpense - totalPriorExpense;
      const pctDiff = Math.round((Math.abs(diffExpense) / totalPriorExpense) * 100);
      if (diffExpense > 0) {
        sentences.push(`Your spending increased by ${pctDiff}% compared to ${priorPeriodName}.`);
      } else if (diffExpense < 0) {
        sentences.push(`Your spending decreased by ${pctDiff}% compared to ${priorPeriodName}.`);
      }
    } else if (currentExpenses.length > 1 && weekendPct > 50 && sentences.length < 3) {
      sentences.push(`Most of your expenses happened during the weekend.`);
    }

    // Strictly limit output to 1-3 sentences
    const finalSentences = sentences.slice(0, 3);
    const summary = finalSentences.join(" ");

    // Build the dynamic suggested tips (no emojis!)
    const suggestedTips: string[] = [];
    if (highestCat && highestCatAmt > 0) {
      suggestedTips.push(`Consider planning your ${highestCat} purchases to optimize your budget next period.`);
    }
    if (totalIncome > 0 && totalIncome > totalExpense) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      suggestedTips.push(`Your savings rate of ${savingsRate.toFixed(0)}% is positive. Consider saving your surplus.`);
    } else {
      suggestedTips.push("Try to log a regular income source to unlock live savings rate analysis.");
    }
    if (dailyAverage > 0) {
      suggestedTips.push(`Your daily average spending was ${formatCurrencyValue(dailyAverage, preferredCurrency)}.`);
    }

    return { summary, suggestedTips };
  };

  // Smart Spending Insights engine (replaces API call)
  const fetchAiInsights = async () => {
    if (!user) return;
    setIsLoadingAiInsights(true);

    const currentTx = getReportTransactions(reportPeriod, reportOffset);
    const priorTx = getPriorPeriodTransactions(reportPeriod, reportOffset);

    // Provide a small 300ms delay to keep a polished, high-fidelity premium experience when manually refreshing
    setTimeout(() => {
      const insights = calculateSmartInsights(currentTx, priorTx, reportPeriod, user.preferredCurrency, savingsGoals);
      setAiInsights(insights);
      setIsLoadingAiInsights(false);
    }, 300);
  };

  // Automatically update local insights whenever transactions, goals, period, offset or currency change
  useEffect(() => {
    if (user) {
      const currentTx = getReportTransactions(reportPeriod, reportOffset);
      const priorTx = getPriorPeriodTransactions(reportPeriod, reportOffset);
      const insights = calculateSmartInsights(currentTx, priorTx, reportPeriod, user.preferredCurrency, savingsGoals);
      setAiInsights(insights);
    }
  }, [transactions, savingsGoals, reportPeriod, reportOffset, user?.preferredCurrency]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Common UI Layout Variables
  const convertedTx = getConvertedTransactions();
  const convertedGoals = getConvertedGoals();
  const monthStats = getMonthStats();
  const catBreakdown = getCategoryBreakdown();

  // Sort and filter transactions for History list
  const getFilteredAndSortedTransactions = () => {
    let list = [...convertedTx];

    // Filter type
    if (filterType !== "all") {
      list = list.filter(t => t.type === filterType);
    }

    // Filter category
    if (filterCategory !== "all") {
      list = list.filter(t => t.category === filterCategory);
    }

    // Filter date range
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0,0,0,0);
      list = list.filter(t => new Date(t.date) >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23,59,59,999);
      list = list.filter(t => new Date(t.date) <= end);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "date_asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount_desc") {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });

    return list;
  };

  // Sort goals by completion closest or target date
  const getSortedGoals = () => {
    return [...convertedGoals].sort((a, b) => {
      const pctA = a.targetAmount > 0 ? (a.currentAmount / a.targetAmount) : 0;
      const pctB = b.targetAmount > 0 ? (b.currentAmount / b.targetAmount) : 0;
      // closest to 100% completion first, or close targets
      return pctB - pctA;
    });
  };

  // Calculate stats for selected Report period
  const reportTxList = getReportTransactions(reportPeriod, reportOffset);
  const reportIncome = reportTxList.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const reportExpense = reportTxList.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const reportNet = reportIncome - reportExpense;

  const reportCategoryTotals = () => {
    const map: Record<string, number> = {};
    const expOnly = reportTxList.filter(t => t.type === "expense");
    expOnly.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, amount]) => {
        const catObj = EXPENSE_CATEGORIES.find(c => c.name === name) || { color: "#6B7280" };
        return { name, amount, color: catObj.color };
      })
      .sort((a, b) => b.amount - a.amount);
  };

  const getFormattedPeriodName = (type: "daily" | "weekly" | "monthly", offset: number) => {
    const { start, end } = getPeriodStartAndEnd(type, offset);
    if (type === "daily") {
      return start.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
    } else if (type === "weekly") {
      const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} - ${endStr}`;
    } else {
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  const currentTheme = user?.themePreference || "system";
  const isSystemDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = currentTheme === "dark" || (currentTheme === "system" && isSystemDark);

  const handleToggleTheme = () => {
    if (!user) return;
    const nextTheme: "light" | "dark" = isDark ? "light" : "dark";
    const updatedUser: User = { ...user, themePreference: nextTheme };
    setUser(updatedUser);
    localStorage.setItem("cash_ate_current_user", JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem("cash_ate_users") || "{}");
    if (users[user.email]) {
      users[user.email] = updatedUser;
      localStorage.setItem("cash_ate_users", JSON.stringify(users));
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-app-gradient flex flex-col font-sans text-theme-body transition-colors duration-300 pb-28 relative"
      id="app-root-container"
    >
      <GlassFilter />
      {/* Header Section */}
      <header className="w-full h-16 px-4 sm:px-8 flex items-center justify-between z-10 bg-white/20 dark:bg-slate-900/10 backdrop-blur-md border-b border-white/10 dark:border-white/5" id="global-header">
        <div className="flex items-center gap-3" id="header-left-side">
          {/* User Profile Avatar with Initials in the top-left (replacing the logo) */}
          <div 
            onClick={() => setCurrentView("settings")}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer transition-all shadow-xs shrink-0 ${
              currentView === "settings"
                ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                : "bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-white/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
            }`}
            title="Profile Settings"
            id="header-user-avatar"
          >
            {user.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
          </div>
          <div className="h-4 w-[1px] bg-slate-300/60 dark:bg-slate-800" id="header-divider" />
          <span className="text-xs sm:text-sm font-bold font-display text-slate-800 dark:text-slate-200 tracking-tight select-none" id="header-view-title">
            {currentView === "home" && "Overview"}
            {currentView === "add_transaction" && "New Transaction"}
            {currentView === "transactions_list" && "Transactions"}
            {currentView === "reports" && "Reports"}
            {currentView === "goals" && "Goals"}
            {currentView === "settings" && "Settings"}
          </span>
        </div>

        <div className="flex items-center gap-2" id="header-controls-group">
          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xs transition-all border bg-white/60 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-300 border-white/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
            id="theme-toggle-button"
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          >
            {isDark ? (
              <LucideIcon name="Sun" size={15} className="text-amber-500 animate-spin-slow" />
            ) : (
              <LucideIcon name="Moon" size={15} className="text-indigo-600" />
            )}
          </button>

          {/* Settings Button */}
          <button 
            onClick={() => setCurrentView("settings")}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xs transition-all border cursor-pointer ${
              currentView === "settings" 
                ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500" 
                : "bg-white/60 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-300 border-white/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
            }`}
            id="profile-settings-button"
            title="Settings"
            aria-label="Settings"
          >
            <LucideIcon name="Settings" size={15} />
          </button>
        </div>
      </header>

      {/* Main Responsive Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-10 py-6" id="app-main-content">
        
        {/* VIEW 1: HOME (DASHBOARD) */}
        {currentView === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start" id="view-dashboard">
            {/* Left Col: Month summary card & Recent activity */}
            <div className="md:col-span-8 flex flex-col gap-6" id="dashboard-left-col">
              
              {/* Month summary card */}
              <div className="premium-card p-6 sm:p-8 grid grid-cols-3 gap-3 sm:gap-6" id="dashboard-summary-card">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-400 mb-1">Net Balance</span>
                  <span className={`text-xl sm:text-2xl font-bold tracking-tight ${monthStats.balance >= 0 ? "text-indigo-900" : "text-rose-600"}`}>
                    {formatCurrencyValue(monthStats.balance, user.preferredCurrency)}
                  </span>
                </div>
                <div className="flex flex-col border-l border-slate-100 pl-3 sm:pl-6">
                  <span className="text-xs font-medium text-slate-400 mb-1">Income</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 truncate">
                    +{formatCurrencyValue(monthStats.income, user.preferredCurrency)}
                  </span>
                </div>
                <div className="flex flex-col border-l border-slate-100 pl-3 sm:pl-6">
                  <span className="text-xs font-medium text-slate-400 mb-1">Expenses</span>
                  <span className="text-base sm:text-lg font-bold text-rose-500 truncate">
                    -{formatCurrencyValue(monthStats.expense, user.preferredCurrency)}
                  </span>
                </div>
              </div>

              {/* Recent Activity List */}
              <div className="premium-card p-6 sm:p-8 flex-1 flex flex-col min-h-[350px]" id="dashboard-activity-container">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-slate-900 font-display">Recent Activity</h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentView("transactions_list")} 
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline mr-2"
                      id="view-all-tx-btn"
                    >
                      View All
                    </button>
                    <button 
                      onClick={startAddTransaction}
                      className="px-4 py-2 bg-accent-gradient hover-bg-accent-gradient text-white rounded-full font-bold text-xs shadow-md accent-glow flex items-center gap-1.5 transition-all duration-300"
                      id="dashboard-add-tx-btn"
                    >
                      <LucideIcon name="Plus" size={14} />
                      Add Transaction
                    </button>
                  </div>
                </div>

                <div className="space-y-3 flex-1" id="recent-transactions-stack">
                  {convertedTx.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center" id="empty-tx-placeholder">
                      <LucideIcon name="Inbox" size={36} className="text-slate-300 mb-2" />
                      <p className="text-sm">No transactions yet.</p>
                      <button onClick={startAddTransaction} className="text-xs text-indigo-600 mt-2 hover:underline">
                        Add a transaction
                      </button>
                    </div>
                  ) : (
                    convertedTx.slice(0, 5).map((t) => {
                      const isIncome = t.type === "income";
                      const catConfig = (isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find(c => c.name === t.category);
                      return (
                        <div 
                          key={t.id} 
                          className="flex items-center justify-between p-3.5 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition"
                          id={`tx-row-${t.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                              style={{ backgroundColor: catConfig?.color || "#9CA3AF" }}
                            >
                              <LucideIcon name={catConfig?.icon || "HelpCircle"} size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm truncate">{t.note || t.category}</p>
                                {t.isSplit && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md">
                                    Split
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-sans">
                                {t.category} • {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {t.isSplit && t.originalAmountRaw && (
                                  <span className="block mt-0.5 text-slate-500 font-medium">
                                    {formatCurrencyValue(convertCurrency(t.originalAmountRaw, t.currency || user.preferredCurrency, user.preferredCurrency), user.preferredCurrency)} total — your share {formatCurrencyValue(t.amount, user.preferredCurrency)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold text-sm ${isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                              {isIncome ? "+" : "-"}{formatCurrencyValue(t.amount, user.preferredCurrency)}
                            </span>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => startEditTransaction(t)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                title="Edit"
                              >
                                <LucideIcon name="Edit3" size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Delete"
                              >
                                <LucideIcon name="Trash2" size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Category Donut & Top Savings Goals */}
            <div className="md:col-span-4 flex flex-col gap-6" id="dashboard-right-col">
              
              {/* Expense Category Donut / Pie preview */}
              <div className="premium-card p-6" id="dashboard-category-card">
                <h3 className="text-sm font-bold text-slate-800 mb-4 font-display">Spend by Category</h3>
                
                {catBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs" id="empty-categories-placeholder">
                    No expenses this month.
                  </div>
                ) : (
                  <div className="space-y-4" id="category-bar-breakdown">
                    {/* SVG mini breakdown visualizer */}
                    <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden shadow-xs" id="category-hbar-visualizer">
                      {catBreakdown.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="h-full transition-all border-r border-white/40 last:border-0"
                          style={{ 
                            width: `${item.percentage}%`, 
                            background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`
                          }}
                          title={`${item.category}: ${item.percentage.toFixed(1)}%`}
                        />
                      ))}
                    </div>

                    {/* Category list legends */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="category-legend-list">
                      {catBreakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-600" id={`legend-${item.category}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="font-medium truncate max-w-[120px]">{item.category}</span>
                          </div>
                          <div className="text-right font-bold text-slate-800">
                            {formatCurrencyValue(item.amount, user.preferredCurrency)}
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              ({item.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Savings Goals top preview */}
              <div className="premium-card p-6" id="dashboard-goals-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 font-display">Goals</h3>
                  <button 
                    onClick={() => setCurrentView("goals")} 
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                    id="manage-goals-shortcut"
                  >
                    Manage
                  </button>
                </div>

                <div className="space-y-4" id="dashboard-goals-stack">
                  {convertedGoals.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                      <LucideIcon name="Target" size={24} className="text-slate-300" />
                      <span>No goals yet.</span>
                      <button onClick={() => setCurrentView("goals")} className="text-indigo-600 mt-1 hover:underline">
                        Add Goal
                      </button>
                    </div>
                  ) : (
                    getSortedGoals().slice(0, 2).map((goal) => {
                      const pct = Math.min(100, goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0);
                      return (
                        <div key={goal.id} className="space-y-1.5" id={`goal-preview-${goal.id}`}>
                          <div className="flex justify-between items-end text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{goal.name}</p>
                              <p className="text-[10px] text-slate-400">Target: {formatCurrencyValue(goal.targetAmount, user.preferredCurrency)}</p>
                            </div>
                            <span className="font-bold text-indigo-600">{pct}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-white" id="goal-bar-outer">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: ADD / EDIT TRANSACTION FORM */}
        {currentView === "add_transaction" && (
          <div className="max-w-md mx-auto premium-card p-6 sm:p-8" id="view-add-transaction">
            <div className="flex items-center gap-3 mb-6" id="add-tx-header">
              <button 
                onClick={() => setCurrentView("home")} 
                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                id="back-from-add-tx"
              >
                <LucideIcon name="ArrowLeft" size={16} />
              </button>
              <h2 className="text-xl font-bold font-display text-slate-800">
                {editingTransaction ? "Edit Transaction" : "New Transaction"}
              </h2>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-5" id="tx-form">
              {/* Income vs Expense Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100" id="tx-type-toggle">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType("expense");
                      // Pick first expense category
                      setTxCategory(EXPENSE_CATEGORIES[0].name);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txType === "expense"
                        ? "bg-white text-rose-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    id="toggle-expense"
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType("income");
                      // Pick first income category
                      setTxCategory(INCOME_CATEGORIES[0].name);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      txType === "income"
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    id="toggle-income"
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1" htmlFor="amount-input">
                  Amount ({getCurrencySymbol(user.preferredCurrency)})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {getCurrencySymbol(user.preferredCurrency)}
                  </span>
                  <input
                    id="amount-input"
                    type="number"
                    step="any"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-slate-50/50 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl" id="category-selector-container">
                  {(txType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setTxCategory(cat.name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                        txCategory === cat.name
                          ? `${cat.borderColor} bg-white shadow-xs font-bold`
                          : "border-transparent hover:bg-slate-50 text-slate-600"
                      }`}
                      id={`category-btn-${cat.name}`}
                    >
                      <span 
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <LucideIcon name={cat.icon} size={14} />
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1" htmlFor="date-input">Date</label>
                <input
                  id="date-input"
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-slate-50/50 text-sm"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1" htmlFor="note-input">Note</label>
                <input
                   id="note-input"
                   type="text"
                   value={txNote}
                   onChange={(e) => setTxNote(e.target.value)}
                   placeholder="e.g. Dinner with friends"
                   className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 bg-slate-50/50 text-sm"
                />
              </div>

              {/* Split Expense Toggle & Sub-fields */}
              {txType === "expense" && (
                <div className="space-y-3 p-4 bg-slate-50/60 rounded-2xl border border-slate-100" id="tx-split-section">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LucideIcon name="Users" size={16} className="text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">Split Expense</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSplitState = !txIsSplit;
                        setTxIsSplit(nextSplitState);
                        if (nextSplitState && txAmount) {
                          const amt = parseFloat(txAmount) || 0;
                          const numOthers = txParticipantNames.split(",").map(s => s.trim()).filter(Boolean).length;
                          setTxYourShare((amt / (numOthers + 1)).toFixed(2));
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        txIsSplit ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                      id="split-toggle-btn"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          txIsSplit ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {txIsSplit && (
                    <div className="space-y-3 pt-3 border-t border-slate-200/50 animate-fade-in text-xs" id="tx-split-details">
                      {/* Participant names */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1" htmlFor="split-participants">
                          Names of people (separate with commas)
                        </label>
                        <input
                          id="split-participants"
                          type="text"
                          value={txParticipantNames}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTxParticipantNames(val);
                            if (txSplitType === "equal" && txAmount) {
                              const amt = parseFloat(txAmount) || 0;
                              const numOthers = val.split(",").map(s => s.trim()).filter(Boolean).length;
                              setTxYourShare((amt / (numOthers + 1)).toFixed(2));
                            }
                          }}
                          placeholder="Alice, Bob"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Enter the other people sharing this expense (not including you).
                        </p>
                      </div>

                      {/* Split Type toggle */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Split Method
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-200/50 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setTxSplitType("equal");
                              if (txAmount) {
                                const amt = parseFloat(txAmount) || 0;
                                const numOthers = txParticipantNames.split(",").map(s => s.trim()).filter(Boolean).length;
                                setTxYourShare((amt / (numOthers + 1)).toFixed(2));
                              }
                            }}
                            className={`py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                              txSplitType === "equal"
                                ? "bg-white text-indigo-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Split Equally
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTxSplitType("manual");
                              if (txAmount && !txYourShare) {
                                const amt = parseFloat(txAmount) || 0;
                                const numOthers = txParticipantNames.split(",").map(s => s.trim()).filter(Boolean).length;
                                setTxYourShare((amt / (numOthers + 1)).toFixed(2));
                              }
                            }}
                            className={`py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                              txSplitType === "manual"
                                ? "bg-white text-indigo-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            Custom Share
                          </button>
                        </div>
                      </div>

                      {/* Your Share Input */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1" htmlFor="your-share-input">
                          Your Share ({getCurrencySymbol(user.preferredCurrency)})
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            {getCurrencySymbol(user.preferredCurrency)}
                          </span>
                          <input
                            id="your-share-input"
                            type="number"
                            step="any"
                            disabled={txSplitType === "equal"}
                            value={txSplitType === "equal" ? (
                              (() => {
                                const numOthers = txParticipantNames.split(",").map(s => s.trim()).filter(Boolean).length;
                                const amt = parseFloat(txAmount) || 0;
                                return (amt / (numOthers + 1)).toFixed(2);
                              })()
                            ) : txYourShare}
                            onChange={(e) => setTxYourShare(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {txSplitType === "equal" 
                            ? "Calculated automatically for you."
                            : "Enter your share of the cost."
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2" id="tx-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTransaction(null);
                    setCurrentView("home");
                  }}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer bg-white"
                  id="cancel-tx-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs bg-accent-gradient hover-bg-accent-gradient accent-glow transition-all duration-300 cursor-pointer"
                  id="save-tx-btn"
                >
                  {editingTransaction ? "Save Changes" : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: FULL TRANSACTIONS LIST (HISTORY) */}
        {currentView === "transactions_list" && (
          <div className="premium-card p-6 sm:p-8" id="view-transactions-list">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3" id="tx-list-header">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentView("home")} 
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                  id="back-from-tx-list"
                >
                  <LucideIcon name="ArrowLeft" size={16} />
                </button>
                <h2 className="text-xl font-bold font-display text-slate-800">Transaction History</h2>
              </div>
            </div>

            {/* Filter Drawer / Panel */}
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100/50 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs" id="tx-list-filters">
              {/* Type filter */}
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Filter Type</label>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Filter Category</label>
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="all">All Categories</option>
                  <optgroup label="Expenses">
                    {EXPENSE_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="Income">
                    {INCOME_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* Date sorting */}
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="date_desc">Newest Date</option>
                  <option value="date_asc">Oldest Date</option>
                  <option value="amount_desc">Highest Amount</option>
                  <option value="amount_asc">Lowest Amount</option>
                </select>
              </div>

              {/* Reset filter */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterCategory("all");
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setSortBy("date_desc");
                  }}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Custom date range sub-filters */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 px-1" id="tx-date-filters">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={filterStartDate} 
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={filterEndDate} 
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Main stack */}
            <div className="space-y-3" id="tx-history-stack">
              {getFilteredAndSortedTransactions().length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <LucideIcon name="Search" size={32} className="text-slate-300" />
                  <span>No transactions match your filters.</span>
                </div>
              ) : (
                getFilteredAndSortedTransactions().map((t) => {
                  const isIncome = t.type === "income";
                  const catConfig = (isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find(c => c.name === t.category);
                  return (
                    <div 
                      key={t.id} 
                      className="flex items-center justify-between p-3.5 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition text-sm"
                      id={`tx-list-row-${t.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: catConfig?.color || "#9CA3AF" }}
                        >
                          <LucideIcon name={catConfig?.icon || "HelpCircle"} size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 truncate">{t.note || t.category}</p>
                            {t.isSplit && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md">
                                Split
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {t.category} • {new Date(t.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            {t.isSplit && t.originalAmountRaw && (
                              <span className="block mt-0.5 text-slate-500 font-medium font-sans">
                                {formatCurrencyValue(convertCurrency(t.originalAmountRaw, t.currency || user.preferredCurrency, user.preferredCurrency), user.preferredCurrency)} total — your share {formatCurrencyValue(t.amount, user.preferredCurrency)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-bold ${isIncome ? "text-emerald-600" : "text-rose-500"}`}>
                          {isIncome ? "+" : "-"}{formatCurrencyValue(t.amount, user.preferredCurrency)}
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => startEditTransaction(t)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            title="Edit"
                          >
                            <LucideIcon name="Edit3" size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            <LucideIcon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: REPORTS WITH AI INSIGHTS */}
        {currentView === "reports" && (
          <div className="space-y-6" id="view-reports">
            
            {/* Header with period toggle & navigation */}
            <div className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4" id="reports-nav-card">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-display text-indigo-950">Financial Reports</h2>
                <div className="flex items-center gap-1 text-xs text-indigo-500 font-bold uppercase tracking-wider" id="report-period-display-wrapper">
                  <span className="shrink-0">{getFormattedPeriodName(reportPeriod, reportOffset)}</span>
                </div>
              </div>

              {/* Navigation controls & period switch */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Offset switcher */}
                <div className="flex bg-slate-50 rounded-xl border border-slate-100 p-1">
                  <button 
                    onClick={() => setReportOffset(prev => prev - 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-indigo-900 transition cursor-pointer"
                    title="Previous Period"
                  >
                    <LucideIcon name="ChevronLeft" size={16} />
                  </button>
                  <button 
                    onClick={() => setReportOffset(0)}
                    className="px-2.5 text-xs font-bold text-indigo-900 hover:bg-white rounded-lg transition cursor-pointer"
                    title="Current Period"
                  >
                    Current
                  </button>
                  <button 
                    onClick={() => setReportOffset(prev => prev + 1)}
                    className="p-1.5 hover:bg-white rounded-lg text-indigo-900 transition cursor-pointer"
                    title="Next Period"
                  >
                    <LucideIcon name="ChevronRight" size={16} />
                  </button>
                </div>

                {/* Tab switch */}
                <div className="flex bg-slate-50 rounded-xl border border-slate-100 p-1" id="reports-period-tabs">
                  {["daily", "weekly", "monthly"].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setReportPeriod(p as any);
                        setReportOffset(0); // Reset offset on scale shift
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                        reportPeriod === p
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Period Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="reports-metrics-row">
              <div className="premium-card p-6 text-center">
                <span className="text-xs font-medium text-slate-400 block mb-1">Period Income</span>
                <span className="text-xl font-bold text-emerald-600">
                  +{formatCurrencyValue(reportIncome, user.preferredCurrency)}
                </span>
              </div>
              <div className="premium-card p-6 text-center">
                <span className="text-xs font-medium text-slate-400 block mb-1">Period Expenses</span>
                <span className="text-xl font-bold text-rose-500">
                  -{formatCurrencyValue(reportExpense, user.preferredCurrency)}
                </span>
              </div>
              <div className="premium-card p-6 text-center">
                <span className="text-xs font-medium text-slate-400 block mb-1">Net Savings</span>
                <span className={`text-xl font-bold ${reportNet >= 0 ? "text-indigo-900" : "text-rose-600"}`}>
                  {formatCurrencyValue(reportNet, user.preferredCurrency)}
                </span>
              </div>
            </div>

            {/* Smart Insights Card (Geometric Balance Theme colors) */}
            <div className="bg-indigo-950 rounded-[32px] p-6 sm:p-8 shadow-xl text-white relative overflow-hidden" id="reports-ai-insights">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <LucideIcon name="Sparkles" size={128} className="text-white" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/15 rounded-lg text-indigo-300">
                      <LucideIcon name="Sparkles" size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Smart Spending Analysis</span>
                  </div>
                  <button 
                    onClick={fetchAiInsights} 
                    disabled={isLoadingAiInsights}
                    className="text-xs font-bold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 disabled:opacity-50"
                  >
                    <LucideIcon name="RefreshCw" size={12} className={isLoadingAiInsights ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {isLoadingAiInsights ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-indigo-300 text-xs">
                    <div className="w-6 h-6 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                    <span>Recalculating financial logs...</span>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-4">
                    <p className="text-sm sm:text-base leading-relaxed text-indigo-50 font-medium">
                      {aiInsights.summary}
                    </p>

                    {aiInsights.suggestedTips && aiInsights.suggestedTips.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">Personalized Tips:</span>
                        <ul className="space-y-1.5">
                          {aiInsights.suggestedTips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-indigo-100 flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-200">No smart spending metrics calculated. Click Refresh to run calculations.</p>
                )}
              </div>
            </div>

            {/* Chart breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="reports-charts-grid">
              
              {/* Category list bar chart breakdown (sorted highest to lowest) */}
              <div className="premium-card p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-6 font-display">Category Breakdown</h3>
                
                {reportCategoryTotals().length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                    <LucideIcon name="BarChart3" size={24} className="text-slate-300" />
                    <span>No expenses in this period.</span>
                  </div>
                ) : (
                  <div className="space-y-4" id="category-bar-chart">
                    {reportCategoryTotals().map((item, idx) => {
                      const maxAmount = Math.max(...reportCategoryTotals().map(x => x.amount)) || 1;
                      const pct = (item.amount / maxAmount) * 100;
                      return (
                        <div key={idx} className="space-y-1" id={`report-cat-bar-${item.name}`}>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-600 truncate max-w-[150px]">{item.name}</span>
                            <span className="text-slate-800">{formatCurrencyValue(item.amount, user.preferredCurrency)}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-50/80 rounded-full overflow-hidden border border-slate-100">
                            <div 
                              className="h-full rounded-full transition-all shadow-xs"
                              style={{ 
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${item.color}, ${item.color}55)`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Visual Income vs Expense comparative chart */}
              <div className="premium-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-6 font-display">Income vs Expense Comparison</h3>
                  
                  {reportIncome === 0 && reportExpense === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                      <LucideIcon name="PieChart" size={24} className="text-slate-300" />
                      <span>No stats to compare.</span>
                    </div>
                  ) : (
                    <div className="space-y-6 py-4" id="reports-comparison-bars">
                      {/* Income Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-500">Total Inflow (Income)</span>
                          <span className="font-bold text-emerald-600">+{formatCurrencyValue(reportIncome, user.preferredCurrency)}</span>
                        </div>
                        <div className="w-full h-5 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex">
                          <div 
                            className="h-full bg-emerald-500 transition-all rounded-r-sm"
                            style={{ width: `${reportIncome + reportExpense > 0 ? (reportIncome / (reportIncome + reportExpense)) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Expense Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-500">Total Outflow (Expense)</span>
                          <span className="font-bold text-rose-500">-{formatCurrencyValue(reportExpense, user.preferredCurrency)}</span>
                        </div>
                        <div className="w-full h-5 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex">
                          <div 
                            className="h-full bg-rose-400 transition-all rounded-r-sm"
                            style={{ width: `${reportIncome + reportExpense > 0 ? (reportExpense / (reportIncome + reportExpense)) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-sans" id="comparison-card-footer">
                  This metrics comparison is calculated on your transactions strictly inside this {reportPeriod} view.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 5: SAVINGS GOALS */}
        {currentView === "goals" && (
          <div className="space-y-6" id="view-savings-goals">
            
            {/* Header section with quick Actions */}
            <div className="premium-card p-6 flex items-center justify-between flex-wrap gap-3" id="goals-header-card">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentView("home")} 
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                  id="back-from-goals"
                >
                  <LucideIcon name="ArrowLeft" size={16} />
                </button>
                <h2 className="text-xl font-bold font-display text-slate-800">Savings Goals</h2>
              </div>
              <button
                onClick={startAddGoal}
                className="px-4 py-2 bg-accent-gradient hover-bg-accent-gradient text-white rounded-full font-bold text-xs shadow-md accent-glow flex items-center gap-1.5 transition-all duration-300"
                id="goals-add-goal-btn"
              >
                <LucideIcon name="Plus" size={14} />
                New Goal
              </button>
            </div>

            {/* Savings goals grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="goals-display-grid">
              {convertedGoals.length === 0 ? (
                <div className="col-span-1 md:col-span-2 premium-card p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3" id="goals-empty-card">
                  <LucideIcon name="Target" size={48} className="text-slate-300" />
                  <p className="font-bold text-slate-700 font-display">No goals set up</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Add goals to save money for big purchases. You will see your progress here.
                  </p>
                  <button onClick={startAddGoal} className="px-4 py-2 bg-accent-gradient hover-bg-accent-gradient text-white rounded-xl text-xs font-bold shadow-md accent-glow mt-2 transition-all duration-300">
                    Create Goal
                  </button>
                </div>
              ) : (
                getSortedGoals().map((goal) => {
                  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const pctRounded = Math.min(100, Math.round(pct));
                  const isCompleted = goal.currentAmount >= goal.targetAmount;

                  return (
                    <div 
                      key={goal.id} 
                      className="premium-card p-6 flex flex-col justify-between gap-6"
                      id={`goal-item-card-${goal.id}`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-base text-slate-800 font-display">{goal.name}</h3>
                            {goal.targetDate && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                                <LucideIcon name="Calendar" size={10} />
                                Target date: {new Date(goal.targetDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button 
                              onClick={() => startEditGoal(goal)}
                              className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                              title="Edit Target"
                            >
                              <LucideIcon name="Edit3" size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Delete Goal"
                            >
                              <LucideIcon name="Trash2" size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Progress meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">
                              {formatCurrencyValue(goal.currentAmount, user.preferredCurrency)} / {formatCurrencyValue(goal.targetAmount, user.preferredCurrency)}
                            </span>
                            <span className={isCompleted ? "text-emerald-600" : "text-indigo-600"}>{pctRounded}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-white" id="goal-bar-parent">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isCompleted 
                                  ? "bg-gradient-to-r from-emerald-400 to-teal-500" 
                                  : "bg-gradient-to-r from-indigo-500 to-purple-500"
                              }`}
                              style={{ width: `${pctRounded}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Add funds overlay control */}
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between" id="goal-action-row">
                        {isCompleted ? (
                          <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100" id="goal-completed-badge">
                            <LucideIcon name="CheckCircle2" size={12} />
                            <span>Target Achieved</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-medium">
                            Need {formatCurrencyValue(Math.max(0, goal.targetAmount - goal.currentAmount), user.preferredCurrency)} more
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setShowAddFundsModal(goal);
                            setAddFundsAmount("");
                          }}
                          className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer"
                          id={`add-funds-btn-${goal.id}`}
                        >
                          Add Funds
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Savings Goal Creation Modal */}
            {showAddGoalModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="goal-editor-overlay">
                <div className="bg-white dark:bg-[#161726] rounded-[32px] p-6 max-w-sm w-full shadow-xl border border-slate-100/50 dark:border-white/5 space-y-5" id="goal-editor-dialog">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 font-display">
                      {editingGoal ? "Edit Savings Goal" : "New Savings Target"}
                    </h3>
                    <button 
                      onClick={() => setShowAddGoalModal(false)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-300 cursor-pointer"
                    >
                      <LucideIcon name="X" size={14} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveGoal} className="space-y-4 text-sm" id="goal-editor-form">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="goal-name-input">Goal Name</label>
                      <input 
                        id="goal-name-input"
                        type="text" 
                        required
                        placeholder="Emergency Fund, New Laptop..."
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-sm bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="goal-target-input">
                        Target Amount ({getCurrencySymbol(user.preferredCurrency)})
                      </label>
                      <input 
                        id="goal-target-input"
                        type="number" 
                        required
                        placeholder="0"
                        value={goalTargetAmount}
                        onChange={(e) => setGoalTargetAmount(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-sm bg-slate-50/50 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="goal-current-input">
                        Current Saved ({getCurrencySymbol(user.preferredCurrency)})
                      </label>
                      <input 
                        id="goal-current-input"
                        type="number" 
                        placeholder="0"
                        value={goalCurrentAmount}
                        onChange={(e) => setGoalCurrentAmount(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-sm bg-slate-50/50 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="goal-date-input">Target Date (Optional)</label>
                      <input 
                        id="goal-date-input"
                        type="date" 
                        value={goalTargetDate}
                        onChange={(e) => setGoalTargetDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-sm bg-slate-50/50"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddGoalModal(false);
                          setEditingGoal(null);
                        }}
                        className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl text-white font-bold text-xs bg-accent-gradient hover-bg-accent-gradient accent-glow transition-all duration-300"
                      >
                        {editingGoal ? "Save Goal" : "Create Goal"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Quick Funds top-up modal */}
            {showAddFundsModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="add-funds-overlay">
                <div className="bg-white dark:bg-[#161726] rounded-[32px] p-6 max-w-sm w-full shadow-xl border border-slate-100/50 dark:border-white/5 space-y-4" id="add-funds-dialog">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 font-display">Add Funds</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">To: {showAddFundsModal.name}</p>
                    </div>
                    <button 
                      onClick={() => setShowAddFundsModal(null)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-300 cursor-pointer"
                    >
                      <LucideIcon name="X" size={14} />
                    </button>
                  </div>

                  <form onSubmit={handleAddFundsSubmit} className="space-y-4" id="add-funds-form">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1" htmlFor="fund-amount-input">
                        Amount to add ({getCurrencySymbol(user.preferredCurrency)})
                      </label>
                      <input 
                        id="fund-amount-input"
                        type="number" 
                        step="any"
                        required
                        autoFocus
                        placeholder="1,000"
                        value={addFundsAmount}
                        onChange={(e) => setAddFundsAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 text-sm font-semibold bg-slate-50/50 dark:bg-slate-950/30"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFundsModal(null)}
                        className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl text-white font-bold text-xs bg-accent-gradient hover-bg-accent-gradient accent-glow transition-all duration-300"
                      >
                        Confirm
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 6: SETTINGS & PREFERENCES */}
        {currentView === "settings" && (
          <div className="max-w-md mx-auto premium-card p-6 sm:p-8 space-y-6" id="view-settings">
            <div className="flex items-center gap-3" id="settings-header">
              <button 
                onClick={() => setCurrentView("home")} 
                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                id="back-from-settings"
              >
                <LucideIcon name="ArrowLeft" size={16} />
              </button>
              <h2 className="text-xl font-bold font-display text-slate-800">Settings</h2>
            </div>

            {/* Profile Info block */}
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 flex items-center gap-4" id="settings-profile-info">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-xs">
                <LucideIcon name="User" size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                <div className="inline-flex items-center gap-1 mt-1 text-[10px] text-indigo-500 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">
                  <LucideIcon name="ShieldCheck" size={10} />
                  <span>Signed in with {user.authProvider}</span>
                </div>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="space-y-3" id="settings-currency-selector">
              <div>
                <h3 className="font-bold text-slate-800 text-sm font-display">Choose Your Currency</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  This changes the currency shown on your overview and goals.
                </p>
              </div>

              <div className="space-y-2" id="settings-currency-list">
                {CURRENCIES.map((curr) => {
                  const isSelected = user.preferredCurrency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      onClick={() => {
                        const updatedUser = { ...user, preferredCurrency: curr.code };
                        setUser(updatedUser);
                        localStorage.setItem("cash_ate_current_user", JSON.stringify(updatedUser));
                        // Update users directory
                        const users = JSON.parse(localStorage.getItem("cash_ate_users") || "{}");
                        if (users[user.email]) {
                          users[user.email] = updatedUser;
                          localStorage.setItem("cash_ate_users", JSON.stringify(users));
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                      }`}
                      id={`settings-currency-option-${curr.code}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold shadow-xs text-slate-600">
                          {curr.symbol}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{curr.code}</div>
                          <div className="text-[10px] text-slate-400">{curr.label}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <LucideIcon name="CheckCircle2" className="text-indigo-500" size={16} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Budget Limit setting */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5" id="settings-budget-limit">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-display">Monthly Budget Limit</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Set your maximum monthly spending limit for budget tracking.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                  {getCurrencySymbol(user.preferredCurrency)}
                </span>
                <input 
                  type="number"
                  placeholder="e.g. 150,000"
                  value={user.monthlyBudgetLimit || ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    const updatedUser = { ...user, monthlyBudgetLimit: val };
                    setUser(updatedUser);
                    localStorage.setItem("cash_ate_current_user", JSON.stringify(updatedUser));
                    // Update users directory
                    const users = JSON.parse(localStorage.getItem("cash_ate_users") || "{}");
                    if (users[user.email]) {
                      users[user.email] = updatedUser;
                      localStorage.setItem("cash_ate_users", JSON.stringify(users));
                    }
                  }}
                  className="w-full pl-8 pr-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100 text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/30"
                />
              </div>
            </div>

            {/* General actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3" id="settings-danger-zone">
              <button
                onClick={() => setShowResetConfirmationModal(true)}
                className="w-full py-2.5 border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-xs bg-white transition cursor-pointer text-center"
                id="reset-to-zero-btn"
              >
                Delete All Data
              </button>

              <button
                onClick={() => {
                  handleLoadDemoData();
                  alert("Sample data loaded! Go to Overview or Reports to see your stats.");
                }}
                className="w-full py-2.5 border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-600 font-bold rounded-xl text-xs bg-white transition cursor-pointer text-center"
                id="load-demo-btn"
              >
                Load Sample Data
              </button>

              <button
                onClick={handleSignOut}
                className="w-full py-2.5 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-xs bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-center"
                id="sign-out-btn"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

            {/* Custom Reset Confirmation Modal (Delete All Data) */}
            {showResetConfirmationModal && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="reset-confirmation-overlay">
                <div className="bg-white dark:bg-[#161726] rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-slate-100/50 dark:border-white/5 space-y-5 animate-fade-in" id="reset-confirmation-dialog">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-rose-600 font-display flex items-center gap-2">
                      <LucideIcon name="AlertTriangle" size={20} className="text-rose-500" />
                      <span>Delete All Data</span>
                    </h3>
                    <button 
                      onClick={() => setShowResetConfirmationModal(false)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-300 cursor-pointer"
                    >
                      <LucideIcon name="X" size={14} />
                    </button>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    Are you sure you want to delete all your data? This action cannot be undone.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmationModal(false)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllData}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs bg-rose-600 hover:bg-rose-500 shadow-md transition cursor-pointer"
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Delete Transaction Confirmation Modal */}
            {transactionToDelete && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="delete-confirmation-overlay">
                <div className="bg-white dark:bg-[#161726] rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-slate-100/50 dark:border-white/5 space-y-5 animate-fade-in" id="delete-confirmation-dialog">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-rose-600 font-display flex items-center gap-2">
                      <LucideIcon name="Trash2" size={20} className="text-rose-500" />
                      <span>Delete Transaction</span>
                    </h3>
                    <button 
                      onClick={() => {
                        setTransactionToDelete(null);
                        setDeleteError(null);
                      }}
                      className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-300 cursor-pointer"
                    >
                      <LucideIcon name="X" size={14} />
                    </button>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    Are you sure you want to delete this transaction? This action cannot be undone.
                  </p>

                  {deleteError && (
                    <div className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
                      Error: {deleteError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionToDelete(null);
                        setDeleteError(null);
                      }}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteTransaction}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs bg-rose-600 hover:bg-rose-500 shadow-md transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Notification Banner */}
            {successNotification && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in" id="success-notification-toast">
                <div className="bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-emerald-500/30">
                  <LucideIcon name="CheckCircle" size={16} className="text-emerald-100" />
                  <span>{successNotification}</span>
                  <button 
                    onClick={() => setSuccessNotification(null)}
                    className="ml-2.5 hover:opacity-85 cursor-pointer p-0.5 hover:bg-white/10 rounded"
                    title="Dismiss"
                  >
                    <LucideIcon name="X" size={14} />
                  </button>
                </div>
              </div>
            )}

          </main>

      {/* Persistent Floating Bottom Tab Navigation */}
      {/* Short floating bottom nav bar with 3 items — Home, Goals, Reports. Rounded pill shape, margin above screen edge, subtle shadow. No plus/add icon in nav bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40" id="floating-bottom-nav">
        <GlassEffect 
          className="w-[240px] h-[64px] rounded-[32px] shadow-2xl border border-white/40"
          innerClassName="flex items-center justify-around w-full h-full px-2"
        >
          {[
            { id: "home", name: "Overview", icon: "Home", activeViews: ["home", "add_transaction", "transactions_list"] },
            { id: "goals", name: "Goals", icon: "Target", activeViews: ["goals"] },
            { id: "reports", name: "Reports", icon: "PieChart", activeViews: ["reports"] },
          ].map((item) => {
            const isActive = item.activeViews.includes(currentView);
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-colors duration-300 group outline-none ${
                  isActive 
                    ? "text-white" 
                    : "text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                }`}
                id={`tab-${item.id}`}
                title={item.name}
              >
                <LucideIcon 
                  name={item.icon} 
                  size={24} 
                  className="relative z-10 transition-transform group-hover:scale-105" 
                />
                
                {isActive && (
                  <motion.div
                    layoutId="active-tab-highlight"
                    className="absolute inset-0 bg-accent-gradient rounded-full shadow-md accent-glow z-0"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </GlassEffect>
      </nav>
    </div>
  );
}
