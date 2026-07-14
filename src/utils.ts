/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EXCHANGE_RATES, CURRENCIES } from "./types";

/**
 * Convert any amount from one currency to another using our static exchange rates.
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string
): number {
  if (fromCode === toCode) return amount;
  
  // Convert from input currency to our base JPY
  const rateFrom = EXCHANGE_RATES[fromCode] || 1.0;
  const amountInJPY = amount * rateFrom;
  
  // Convert from base JPY to the target currency
  const rateTo = EXCHANGE_RATES[toCode] || 1.0;
  return amountInJPY / rateTo;
}

/**
 * Formats currency values according to JPY/USD/EUR/GBP specifications.
 * JPY uses no decimal digits. USD/EUR/GBP use two decimal digits.
 */
export function formatCurrencyValue(amount: number, currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  const formatters: Record<string, Intl.NumberFormat> = {
    JPY: new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    EUR: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }),
    GBP: new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }),
  };

  const formatter = formatters[code];
  if (formatter) {
    return formatter.format(amount);
  }

  // Fallback
  return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Gets currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : code;
}
