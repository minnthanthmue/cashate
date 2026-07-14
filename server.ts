import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization helper for Gemini SDK to prevent startup crashes when API key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for AI insights
app.post("/api/ai/insights", async (req, res) => {
  try {
    const userEmail = req.headers["x-user-email"] as string;
    if (!userEmail) {
      console.warn("[Insights API] Unauthorized access attempt: missing x-user-email header.");
      return res.status(401).json({ error: "Unauthorized: Missing authentication credentials." });
    }

    const {
      transactions = [],
      periodType = "monthly", // daily, weekly, monthly
      preferredCurrency = "JPY",
      priorPeriodTransactions = [],
    } = req.body;

    // Helper for case-insensitive email comparison
    const isSameEmail = (email1: string, email2: string) => {
      if (!email1 || !email2) return false;
      return email1.trim().toLowerCase() === email2.trim().toLowerCase();
    };

    // Authorization validation: ensure all passed transactions belong to the authenticated userEmail (case-insensitive)
    const unauthorizedTxExists = transactions.some((t: any) => t.userId && !isSameEmail(t.userId, userEmail));
    const unauthorizedPriorTxExists = priorPeriodTransactions.some((t: any) => t.userId && !isSameEmail(t.userId, userEmail));

    if (unauthorizedTxExists || unauthorizedPriorTxExists) {
      console.warn(`[Insights API] Forbidden access attempt: User ${userEmail} requested insights but transactions belong to other users.`);
      return res.status(403).json({ error: "Forbidden: You are not authorized to view or analyze other users' financial transactions." });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      // Graceful fallback when API key is not configured
      console.info("[Insights API] Gemini API Key is not configured. Serving local/offline summary fallback.");
      return res.json({
        summary: `Cash Ate AI spending analysis is ready. Since your Gemini API key is not configured in the Secrets panel, here is a quick summary: You recorded ${transactions.length} transactions for this period. Add your GEMINI_API_KEY to unlock fully tailored, natural-language spending guides.`,
        suggestedTips: [
          "Set up your savings goals to budget more effectively.",
          "Keep categorization consistent for clearer breakdown charts.",
          "Configure your API key in settings to activate AI insights."
        ]
      });
    }

    // Process transactions for stats
    const expenses = transactions.filter((t: any) => t.type === "expense");
    const incomes = transactions.filter((t: any) => t.type === "income");

    const totalExpense = expenses.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const totalIncome = incomes.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    // Compute average spend per day
    let durationDays = 30;
    if (periodType === "daily") durationDays = 1;
    else if (periodType === "weekly") durationDays = 7;
    const avgDailySpend = durationDays > 0 ? (totalExpense / durationDays) : totalExpense;

    // Rank categories
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((t: any) => {
      const cat = t.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
    });

    const sortedCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const topCategories = sortedCategories.slice(0, 3).map(cat => {
      const pct = totalExpense > 0 ? ((cat.amount / totalExpense) * 100).toFixed(1) : "0";
      return { ...cat, percentage: pct };
    });

    // Process prior period for trend
    const priorExpenses = priorPeriodTransactions.filter((t: any) => t.type === "expense");
    const priorTotalExpense = priorExpenses.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    
    let trendDirection = "stable";
    let trendPercentage = "0%";
    if (priorTotalExpense > 0) {
      const diff = totalExpense - priorTotalExpense;
      const pct = (Math.abs(diff) / priorTotalExpense) * 100;
      trendDirection = diff > 0 ? "higher" : "lower";
      trendPercentage = `${pct.toFixed(1)}%`;
    }

    // Format currency symbol/prefix
    const formatCurrency = (val: number) => {
      if (preferredCurrency === "JPY") {
        return `¥${Math.round(val).toLocaleString()}`;
      } else if (preferredCurrency === "USD") {
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else if (preferredCurrency === "EUR") {
        return `€${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        return `${preferredCurrency} ${val.toLocaleString()}`;
      }
    };

    // Construct detailed prompt for Gemini
    const prompt = `
You are the AI spending analyst for the personal finance tracker app "Cash Ate".
Analyze the user's spending data and generate a short, highly helpful, and natural-language summary (strictly 2 to 4 sentences). Do not use any emojis whatsoever in your output.

Stats for current period (${periodType}):
- Total Income: ${formatCurrency(totalIncome)}
- Total Expense: ${formatCurrency(totalExpense)}
- Net Balance: ${formatCurrency(totalIncome - totalExpense)}
- Average Daily Spend: ${formatCurrency(avgDailySpend)}
- Top categories of spending:
${topCategories.map(c => `  * ${c.name}: ${formatCurrency(c.amount)} (${c.percentage}% of total expense)`).join("\n")}
- Comparison with prior same-length period:
  * Prior Total Expense was: ${formatCurrency(priorTotalExpense)}
  * Spent ${trendPercentage} ${trendDirection} than the previous period.

Guidelines for response:
- Keep it professional, encouraging, objective, and extremely scannable.
- Explicitly mention the top category or categories.
- Reference the numbers clearly.
- Strictly NO emojis.
- Write a 2-4 sentence summary.

Return a JSON object in this format (do not return raw markdown text, only JSON):
{
  "summary": "The 2-4 sentence summary goes here.",
  "suggestedTips": [
    "Tip 1 based on their spending behavior",
    "Tip 2 based on their spending behavior",
    "Tip 3 based on their spending behavior"
  ]
}
`;

    let insights;
    try {
      // Call Gemini Model
      const ai = getAiClient();
      if (!ai) {
        throw new Error("AI client is not initialized because the Gemini API key is missing or invalid.");
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "{}";
      try {
        insights = JSON.parse(rawText.trim());
      } catch (parseErr) {
        // Fallback if parsing fails
        insights = {
          summary: rawText,
          suggestedTips: [
            "Keep updating your transaction record daily.",
            "Check category charts to pinpoint top expenses.",
            "Create savings goals to manage large future payouts."
          ]
        };
      }
    } catch (apiErr: any) {
      const errMessage = apiErr?.message || "";
      const errDetails = typeof apiErr === "object" ? JSON.stringify(apiErr) : String(apiErr);
      const isPrepayDepleted = errMessage.includes("prepayment credits") || 
                              errDetails.includes("prepayment credits") || 
                              errMessage.includes("RESOURCE_EXHAUSTED") || 
                              errDetails.includes("RESOURCE_EXHAUSTED") ||
                              errDetails.includes("429");

      console.warn("Gemini API direct call failed, generating offline/local fallback. Error details:", errMessage || errDetails);
      
      const topCatStr = topCategories.length > 0 
        ? ` Your top spending category was ${topCategories[0].name} (${topCategories[0].percentage}% of total expenses)${topCategories[1] ? `, followed by ${topCategories[1].name}` : ""}.`
        : "";
      
      const trendStr = priorTotalExpense > 0 
        ? ` Your overall spend was ${trendPercentage} ${trendDirection} than the previous period.` 
        : "";

      let localSummary = "";
      let localTips: string[] = [];

      if (isPrepayDepleted) {
        localSummary = `Your Gemini API prepayment credits are depleted. To resolve this, please check your AI Studio project billing. In the meantime, we have generated a local offline analysis of your spending behavior: you recorded ${transactions.length} transactions, resulting in a total expense of ${formatCurrency(totalExpense)} and total income of ${formatCurrency(totalIncome)} (net balance of ${formatCurrency(totalIncome - totalExpense)}).${topCatStr}${trendStr}`;
        localTips = [
          "Action Required: Top up your AI Studio prepayment credits at https://ai.studio/projects to restore live AI insights.",
          topCategories[0] 
            ? `Review your transactions in your highest category (${topCategories[0].name}) to identify potential cutbacks.`
            : "Review your transactions lists to identify potential savings.",
          "Record your daily transactions regularly to maintain clear historic statistics."
        ];
      } else {
        localSummary = `For this ${periodType} period, you recorded ${transactions.length} transactions, resulting in a total expense of ${formatCurrency(totalExpense)} and total income of ${formatCurrency(totalIncome)} (net balance of ${formatCurrency(totalIncome - totalExpense)}). Your average daily spend was ${formatCurrency(avgDailySpend)}.${topCatStr}${trendStr} (Generated using local data fallback).`;
        localTips = [
          topCategories[0] 
            ? `Review your transactions in your highest category (${topCategories[0].name}) to identify potential cutbacks.`
            : "Review your transactions lists to identify potential savings.",
          "Record your daily transactions regularly to maintain clear historic statistics.",
          "Set achievable limits in your Savings Goals tab to plan large future purchases."
        ];
      }

      insights = {
        summary: localSummary,
        suggestedTips: localTips
      };
    }

    res.json(insights);
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({
      error: "Failed to generate AI insights",
      details: err.message,
      summary: "We encountered an issue analyzing your statistics with AI right now, but your charts and graphs below are fully loaded.",
      suggestedTips: [
        "Record your daily transactions to keep your sheets accurate.",
        "Ensure your category assignments are clean and accurate.",
        "Set achievable targets in the Goals tab."
      ]
    });
  }
});

// Serve frontend assets and start listening
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
