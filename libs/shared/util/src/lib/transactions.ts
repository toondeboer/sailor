import {
  Stock,
  Transaction,
  TransactionDbo,
  TransactionKey,
  TransactionType,
  Transactions,
  TransactionsDbo,
} from './types';
import { isSameDay } from './core';

function initDefaultStock(ticker: string): Stock {
  return {
    ticker,
    transactions: {
      stock: [],
      dividend: [],
      commission: [],
    },
    summary: {
      portfolioValue: 0,
      totalInvested: 0,
      totalDividend: 0,
      totalCommission: 0,
      amountOfShares: 0,
      averageSharePrice: 0,
      currentSharePrice: 0,
      dailyReturn: {
        absolute: 0,
        percentage: 0,
      },
      weeklyReturn: {
        absolute: 0,
        percentage: 0,
      },
      monthlyReturn: {
        absolute: 0,
        percentage: 0,
      },
      totalReturn: {
        absolute: 0,
        percentage: 0,
      },
    },
    chartData: {
      stock: {
        transactionAmounts: [],
        transactionValues: [],
        aggregatedAmounts: [],
        aggregatedValues: [],
      },
      dividend: {
        transactionAmounts: [],
        transactionValues: [],
        aggregatedAmounts: [],
        aggregatedValues: [],
        perQuarterByYear: [],
        perQuarter: { yearQuarters: [], dividends: [] },
        ttmPerQuarter: { yearQuarters: [], dividends: [] },
      },
      commission: {
        transactionAmounts: [],
        transactionValues: [],
        aggregatedAmounts: [],
        aggregatedValues: [],
      },
      portfolioValues: [],
      profit: [],
      yieldPerYear: { years: [], yields: [], profit: [] },
    },
    currency: { value: 'EUR' },
  };
}

export function transactionsDboToTransactions(
  transactions: TransactionsDbo
): Transactions {
  const stock: Transaction[] = [];
  const dividend: Transaction[] = [];
  const commission: Transaction[] = [];

  transactions.stock.forEach((transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      type: transaction.type as TransactionType,
      date: new Date(transaction.date),
    };
    stock.push(newTransaction);
  });

  transactions.dividend.forEach((transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      type: transaction.type as TransactionType,
      date: new Date(transaction.date),
    };
    dividend.push(newTransaction);
  });

  transactions.commission.forEach((transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      type: transaction.type as TransactionType,
      date: new Date(transaction.date),
    };
    commission.push(newTransaction);
  });

  return {
    stock: sortTransactions(stock),
    dividend: sortTransactions(dividend),
    commission: sortTransactions(commission),
  };
}

function getCurrency(currency: string): { value: string } {
  return { value: currency };
}

/**
 * Returns the Yahoo Finance FX ticker and optional sub-unit multiplier needed
 * to convert a stock's native currency into the chosen display currency.
 * Returns an empty object when no conversion is required (same currency) or
 * the pair is not supported.
 *
 * EUR=X  : USD → EUR rate  (multiply USD value to get EUR)
 * GBPEUR=X: GBP → EUR rate
 * EURUSD=X: EUR → USD rate
 * GBPUSD=X: GBP → USD rate
 * GBp is UK pence — use the GBP ticker then scale by 0.01.
 */
export function getFxTickerForConversion(
  stockCurrency: string,
  displayCurrency: string
): { yahooTicker?: string; fxMultiplier?: number } {
  if (stockCurrency === displayCurrency) return {};
  switch (displayCurrency) {
    case 'EUR':
      switch (stockCurrency) {
        case 'USD': return { yahooTicker: 'EUR=X' };
        case 'GBP': return { yahooTicker: 'GBPEUR=X' };
        case 'GBp': return { yahooTicker: 'GBPEUR=X', fxMultiplier: 0.01 };
        default:    return {};
      }
    case 'USD':
      switch (stockCurrency) {
        case 'EUR': return { yahooTicker: 'EURUSD=X' };
        case 'GBP': return { yahooTicker: 'GBPUSD=X' };
        case 'GBp': return { yahooTicker: 'GBPUSD=X', fxMultiplier: 0.01 };
        default:    return {};
      }
    default:
      return {};
  }
}

export function transactionsDboToStocks(transactions: TransactionsDbo): {
  [ticker: string]: Stock;
} {
  const stocks: { [ticker: string]: Stock } = {};

  transactions.stock.forEach((transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      type: transaction.type as TransactionType,
      date: new Date(transaction.date),
    };
    if (!stocks[transaction.ticker]) {
      stocks[transaction.ticker] = initDefaultStock(transaction.ticker);
      stocks[transaction.ticker].currency = getCurrency(transaction.currency);
    }
    stocks[transaction.ticker].transactions.stock.push(newTransaction);
    stocks[transaction.ticker].transactions.stock = sortTransactions(
      stocks[transaction.ticker].transactions.stock
    );
  });

  transactions.dividend.forEach((transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      type: transaction.type as TransactionType,
      date: new Date(transaction.date),
    };
    if (!stocks[transaction.ticker]) {
      stocks[transaction.ticker] = initDefaultStock(transaction.ticker);
      stocks[transaction.ticker].currency = getCurrency(transaction.currency);
    }
    stocks[transaction.ticker].transactions.dividend.push(newTransaction);
    stocks[transaction.ticker].transactions.dividend = sortTransactions(
      stocks[transaction.ticker].transactions.dividend
    );
  });

  transactions.commission.forEach((transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      type: transaction.type as TransactionType,
      date: new Date(transaction.date),
    };
    if (!stocks[transaction.ticker]) {
      stocks[transaction.ticker] = initDefaultStock(transaction.ticker);
      stocks[transaction.ticker].currency = getCurrency(transaction.currency);
    }
    stocks[transaction.ticker].transactions.commission.push(newTransaction);
    stocks[transaction.ticker].transactions.commission = sortTransactions(
      stocks[transaction.ticker].transactions.commission
    );
  });

  return stocks;
}

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.sort((t1, t2) => {
    if (t1.date < t2.date) {
      return -1;
    } else {
      return 1;
    }
  });
}

export function getTransactionAmountsAndValues(
  dates: Date[],
  transactions: Transaction[]
): {
  transactionAmounts: number[];
  transactionValues: number[];
  aggregatedAmounts: number[];
  aggregatedValues: number[];
} {
  const amounts: number[] = [];
  const values: number[] = [];
  const aggregatedAmounts: number[] = [];
  const aggregatedValues: number[] = [];
  let index = 0;
  let currentTransaction: Transaction = transactions[index];

  if (transactions.length === 0) {
    const nanArray = Array(dates.length).fill(NaN);
    const zerosArray = Array(dates.length).fill(0);
    return {
      transactionAmounts: nanArray,
      transactionValues: nanArray,
      aggregatedAmounts: zerosArray,
      aggregatedValues: zerosArray,
    };
  }

  for (const date of dates) {
    if (!isSameDay(date, currentTransaction.date)) {
      if (aggregatedAmounts.length === 0) {
        amounts.push(0);
        values.push(0);
        aggregatedAmounts.push(0);
        aggregatedValues.push(0);
      } else {
        amounts.push(NaN);
        values.push(NaN);
        aggregatedAmounts.push(aggregatedAmounts[aggregatedAmounts.length - 1]);
        aggregatedValues.push(aggregatedValues[aggregatedValues.length - 1]);
      }
    } else {
      let newAmount = 0;
      let newValue = 0;
      while (isSameDay(date, currentTransaction.date)) {
        newAmount += currentTransaction.amount;
        newValue += currentTransaction.value;

        index += 1;
        if (index >= transactions.length) {
          break;
        }
        currentTransaction = transactions[index];
      }
      amounts.push(newAmount);
      values.push(newValue);
      if (aggregatedAmounts.length === 0) {
        aggregatedAmounts.push(newAmount);
        aggregatedValues.push(newValue);
      } else {
        aggregatedAmounts.push(
          aggregatedAmounts[aggregatedAmounts.length - 1] + newAmount
        );
        aggregatedValues.push(
          aggregatedValues[aggregatedValues.length - 1] + newValue
        );
      }
    }
  }
  return {
    transactionAmounts: amounts,
    transactionValues: values,
    aggregatedAmounts,
    aggregatedValues,
  };
}

export function getStartDate(stocks: { [ticker: string]: Stock }): Date {
  let startDate: Date = new Date();

  for (const key in stocks) {
    const transactions = stocks[key].transactions;
    for (const transaction of transactions.stock) {
      startDate = transaction.date < startDate ? transaction.date : startDate;
    }
    for (const transaction of transactions.dividend) {
      startDate = transaction.date < startDate ? transaction.date : startDate;
    }
    for (const transaction of transactions.commission) {
      startDate = transaction.date < startDate ? transaction.date : startDate;
    }
  }

  return startDate;
}

export function getCurrencies(stocks: { [ticker: string]: Stock }): string[] {
  const set = new Set<string>();
  for (const stock of Object.values(stocks)) {
    for (const dc of ['EUR', 'USD']) {
      const { yahooTicker } = getFxTickerForConversion(stock.currency.value, dc);
      if (yahooTicker) set.add(yahooTicker);
    }
  }
  return [...set];
}

export function transactionToTransactionDbo(tx: Transaction): TransactionDbo {
  return {
    ticker: tx.ticker,
    type: tx.type,
    date: tx.date.toISOString().split('T')[0],
    time: tx.time,
    amount: tx.amount,
    value: tx.value,
    currency: tx.currency,
  };
}

function txDboKey(tx: TransactionDbo): string {
  return `${tx.ticker}|${tx.date}|${tx.time ?? ''}|${tx.value}`;
}

export function deduplicateTransactions(txs: TransactionDbo[]): TransactionDbo[] {
  const seen = new Set<string>();
  return txs.filter((tx) => {
    const key = txDboKey(tx);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mergeTransactionsDbo(all: TransactionsDbo[]): TransactionsDbo {
  const stock: TransactionDbo[] = [];
  const dividend: TransactionDbo[] = [];
  const commission: TransactionDbo[] = [];
  for (const t of all) {
    stock.push(...t.stock);
    dividend.push(...t.dividend);
    commission.push(...t.commission);
  }
  return {
    stock: deduplicateTransactions(stock),
    dividend: deduplicateTransactions(dividend),
    commission: deduplicateTransactions(commission),
  };
}

export function mergeTransactions(
  existing: TransactionsDbo,
  incoming: TransactionsDbo
): TransactionsDbo {
  return mergeTransactionsDbo([existing, incoming]);
}

export function matchesTransactionKey(tx: TransactionDbo, key: TransactionKey): boolean {
  return (
    tx.type === key.type &&
    tx.ticker === key.ticker &&
    tx.date === key.date &&
    (tx.time ?? '') === (key.time ?? '') &&
    tx.value === key.value
  );
}
