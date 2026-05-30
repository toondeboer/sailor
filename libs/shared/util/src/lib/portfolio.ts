import { Stock, Summary, Ticker, Transactions, TransactionsDbo } from './types';
import {
  addLists,
  getCurrencies,
  getDailyDates,
  getDividendPerQuarter,
  getDividendPerQuarterByYear,
  getDividendTtmPerQuarter,
  getMostRecentValueFromList,
  getPortfolioValues,
  getReturn,
  getStartDate,
  getTransactionAmountsAndValues,
  getYieldPerYear,
  subtractLists,
  transactionsDboToStocks,
  transactionsDboToTransactions,
  updateDividends,
} from './util';

export interface PortfolioState {
  transactions: Transactions;
  stocks: { [ticker: string]: Stock };
  dates: Date[];
  summary: Summary;
  currencies: string[];
}

export function createInitialSummary(): Summary {
  return {
    portfolioValue: 0,
    totalInvested: 0,
    totalDividend: 0,
    totalCommission: 0,
    startDate: new Date(),
    dailyReturn: { absolute: 0, percentage: 0 },
    weeklyReturn: { absolute: 0, percentage: 0 },
    monthlyReturn: { absolute: 0, percentage: 0 },
    totalReturn: { absolute: 0, percentage: 0 },
  };
}

/**
 * Derives the full portfolio view-model from the raw inputs: the stored
 * transactions (DTO) and the fetched Yahoo price tickers.
 *
 * This is a pure, memoizable port of what used to live in the NgRx reducer.
 * It runs in two stages, mirroring the old getDataSuccess and setChartData
 * handlers:
 *   1. transaction-derived data (amounts, values, dividends, invested totals),
 *      available as soon as the transactions load.
 *   2. price-derived data (portfolio value, profit, returns, yield), added once
 *      the Yahoo tickers are available.
 */
export function computePortfolioState(
  transactionsDbo: TransactionsDbo,
  tickers: { [ticker: string]: Ticker }
): PortfolioState {
  const baseStocks = transactionsDboToStocks(transactionsDbo);
  const transactions = transactionsDboToTransactions(transactionsDbo);
  const currencies = getCurrencies(baseStocks);

  // No transactions yet -> empty portfolio with default summary.
  if (Object.keys(baseStocks).length === 0) {
    return {
      transactions,
      stocks: {},
      dates: [],
      summary: createInitialSummary(),
      currencies,
    };
  }

  // --- Stage 1: transaction-derived data ---
  const startDate = getStartDate(baseStocks);
  const dates = getDailyDates(startDate, new Date());

  let totalInvestedSummary = 0;
  let totalDividendSummary = 0;
  let totalCommissionSummary = 0;

  const computedStocks: { [ticker: string]: Stock } = {};
  for (const key of Object.keys(baseStocks)) {
    const stock = baseStocks[key];
    const t = stock.transactions;

    const stockAmountsAndValues = getTransactionAmountsAndValues(dates, t.stock);
    const dividendAmountsAndValues = getTransactionAmountsAndValues(
      dates,
      t.dividend
    );
    const dividendPerQuarterByYear = getDividendPerQuarterByYear(
      startDate,
      t.dividend
    );
    const dividendPerQuarter = getDividendPerQuarter(
      startDate,
      dividendPerQuarterByYear
    );
    const dividendTtmPerQuarter = getDividendTtmPerQuarter(dividendPerQuarter);
    const commissionAmountsAndValues = getTransactionAmountsAndValues(
      dates,
      t.commission
    );

    const totalInvested = getMostRecentValueFromList(
      stockAmountsAndValues.aggregatedValues
    ).value;
    totalInvestedSummary += totalInvested;
    const amountOfShares = getMostRecentValueFromList(
      stockAmountsAndValues.aggregatedAmounts
    ).value;
    const totalDividend = getMostRecentValueFromList(
      dividendAmountsAndValues.aggregatedValues
    ).value;
    totalDividendSummary += totalDividend;
    const totalCommission = getMostRecentValueFromList(
      commissionAmountsAndValues.aggregatedValues
    ).value;
    totalCommissionSummary += totalCommission;

    computedStocks[key] = {
      ...stock,
      chartData: {
        ...stock.chartData,
        stock: { ...stockAmountsAndValues },
        dividend: {
          ...dividendAmountsAndValues,
          perQuarterByYear: dividendPerQuarterByYear,
          perQuarter: dividendPerQuarter,
          ttmPerQuarter: dividendTtmPerQuarter,
        },
        commission: { ...commissionAmountsAndValues },
      },
      summary: {
        ...stock.summary,
        totalInvested,
        amountOfShares,
        averageSharePrice:
          amountOfShares !== 0 ? totalInvested / amountOfShares : 0,
        totalDividend,
        totalCommission,
      },
    };
  }

  let summary: Summary = {
    ...createInitialSummary(),
    totalInvested: totalInvestedSummary,
    totalDividend: totalDividendSummary,
    totalCommission: totalCommissionSummary,
    startDate,
  };

  // No prices yet -> return the transaction-only view.
  if (Object.keys(tickers).length === 0) {
    return { transactions, stocks: computedStocks, dates, summary, currencies };
  }

  // --- Stage 2: price-derived data ---
  let portfolioValuesSummary = 0;
  let aggregatedPortfolioValues: number[] = [];
  let aggregatedProfit: number[] = [];
  let chartTotalDividendSummary = 0;

  const chartedStocks: { [ticker: string]: Stock } = {};
  for (const key of Object.keys(computedStocks)) {
    const stock = computedStocks[key];
    const ticker = tickers[key];

    // Prices for this stock haven't arrived (yet) — keep the stage-1 view so a
    // transient ticker/transaction mismatch can't crash the derivation.
    if (!ticker) {
      chartedStocks[key] = stock;
      continue;
    }

    const portfolioValues = getPortfolioValues(
      dates,
      stock.chartData.stock.aggregatedAmounts,
      ticker
    );
    aggregatedPortfolioValues =
      aggregatedPortfolioValues.length > 0
        ? addLists(aggregatedPortfolioValues, portfolioValues)
        : portfolioValues;
    const portfolioValue = getMostRecentValueFromList(portfolioValues).value;
    portfolioValuesSummary += portfolioValue;

    const profit = subtractLists(
      subtractLists(portfolioValues, stock.chartData.stock.aggregatedValues),
      stock.chartData.commission.aggregatedValues
    );
    aggregatedProfit =
      aggregatedProfit.length > 0
        ? addLists(aggregatedProfit, profit)
        : profit;

    const dailyReturn = getReturn(portfolioValues, profit, 1);
    const weeklyReturn = getReturn(portfolioValues, profit, 7);
    const monthlyReturn = getReturn(portfolioValues, profit, 30);
    const totalReturn = getReturn(portfolioValues, profit, portfolioValues.length);

    const yieldPerYear = getYieldPerYear(dates, portfolioValues, profit);

    const updatedDividend = updateDividends(
      stock.chartData.dividend,
      stock.chartData.stock.aggregatedAmounts,
      ticker,
      dates,
      startDate
    );

    const totalDividend = getMostRecentValueFromList(
      updatedDividend.aggregatedValues
    ).value;
    chartTotalDividendSummary += totalDividend;

    chartedStocks[key] = {
      ...stock,
      summary: {
        ...stock.summary,
        portfolioValue,
        currentSharePrice: getMostRecentValueFromList(ticker.values).value,
        dailyReturn,
        weeklyReturn,
        monthlyReturn,
        totalReturn,
        totalDividend,
      },
      chartData: {
        ...stock.chartData,
        portfolioValues,
        profit,
        yieldPerYear,
        dividend: updatedDividend,
      },
    };
  }

  summary = {
    ...summary,
    portfolioValue: portfolioValuesSummary,
    dailyReturn: getReturn(aggregatedPortfolioValues, aggregatedProfit, 1),
    weeklyReturn: getReturn(aggregatedPortfolioValues, aggregatedProfit, 7),
    monthlyReturn: getReturn(aggregatedPortfolioValues, aggregatedProfit, 30),
    totalReturn: getReturn(
      aggregatedPortfolioValues,
      aggregatedProfit,
      aggregatedPortfolioValues.length
    ),
    totalDividend: chartTotalDividendSummary,
  };

  return { transactions, stocks: chartedStocks, dates, summary, currencies };
}
