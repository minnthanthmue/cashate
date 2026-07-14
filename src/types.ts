/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AuthProvider = "email" | "google" | "apple";

export interface User {
  email: string;
  name: string;
  preferredCurrency: string; // "JPY", "USD", "EUR" etc.
  authProvider: AuthProvider;
  isFirstLogin: boolean;
  themePreference?: "light" | "dark" | "system";
  monthlyBudgetLimit?: number;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  currency: string;
  isSplit?: boolean;
  splitWith?: string[];
  yourShare?: number;
  originalAmountRaw?: number;
  originalYourShareRaw?: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  currency: string;
}

export interface CategoryInfo {
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind hex or class color
  borderColor: string;
}

// Fixed currencies supported by conversions
export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: "JPY", symbol: "¥", label: "Japanese Yen (JPY)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "GBP", symbol: "£", label: "British Pound (GBP)" },
];

// static exchange rates where JPY is base for conversion (or standard base JPY)
// JPY base: JPY = 1.0, USD = 150 JPY, EUR = 160 JPY, GBP = 190 JPY
export const EXCHANGE_RATES: Record<string, number> = {
  JPY: 1.0,
  USD: 150.0,
  EUR: 160.0,
  GBP: 190.0,
};

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { name: "Food", icon: "Utensils", color: "#F87171", borderColor: "border-red-400" }, // red
  { name: "Housing/Rent", icon: "Home", color: "#60A5FA", borderColor: "border-blue-400" }, // blue
  { name: "Internet", icon: "Wifi", color: "#34D399", borderColor: "border-emerald-400" }, // emerald
  { name: "School Fee", icon: "GraduationCap", color: "#FBBF24", borderColor: "border-amber-400" }, // amber
  { name: "Transportation", icon: "Car", color: "#818CF8", borderColor: "border-indigo-400" }, // indigo
  { name: "Utilities", icon: "Zap", color: "#A78BFA", borderColor: "border-violet-400" }, // violet
  { name: "Entertainment", icon: "Tv", color: "#F472B6", borderColor: "border-pink-400" }, // pink
  { name: "Healthcare", icon: "HeartPulse", color: "#2DD4BF", borderColor: "border-teal-400" }, // teal
  { name: "Shopping", icon: "ShoppingBag", color: "#FB923C", borderColor: "border-orange-400" }, // orange
  { name: "Other", icon: "HelpCircle", color: "#9CA3AF", borderColor: "border-gray-400" }, // gray
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { name: "Salary", icon: "Briefcase", color: "#34D399", borderColor: "border-emerald-400" }, // emerald
  { name: "Allowance", icon: "Coins", color: "#FBBF24", borderColor: "border-amber-400" }, // amber
  { name: "Freelance", icon: "Laptop", color: "#60A5FA", borderColor: "border-blue-400" }, // blue
  { name: "Gift", icon: "Gift", color: "#F472B6", borderColor: "border-pink-400" }, // pink
  { name: "Other", icon: "HelpCircle", color: "#9CA3AF", borderColor: "border-gray-400" }, // gray
];
