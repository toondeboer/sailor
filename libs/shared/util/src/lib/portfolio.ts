import { PortfolioDbo, Stock, Summary, Ticker, Transactions, TransactionsDbo } from './types';
import {
  addLists,
  getCurrencies,
  getDailyDates,
  getDividendPerQuarter,
  getDividendPerQuarterByYear,
  getDividendTtmPerQuarter,
  getFxTickerForConversion,
  getMostRecentValueFromList,
  getPortfolioValues,
  getReturn,
  getStartDate,
  getTransactionAmountsAndValues,
  getYieldPerYear,
  isSameDay,
  multiplyLists,
  subtractLists,
  transactionsDboToStocks,
  transactionsDboToTransactions,
  updateDividends,
} from './util';

/**
 * Returns an array of FX rates aligned to the given portfolio dates using the
 * nearest available rate (forward fill, then backward fill for dates before the
 * first data point). Treats zero values as missing, matching how Yahoo Finance
 * omits rates on weekends and holidays.
 *
 * Throws when the FX ticker has no valid values at all so callers can surface
 * the error to the user rather than silently producing wrong numbers.
 */
function getFxRates(dates: Date[], fxTicker: Ticker): number[] {
  const rates = new Array<number>(dates.length).fill(NaN);
  let fxIdx = 0;
  let lastKnownRate = NaN;

  // Forward pass: carry the last known rate forward.
  for (let i = 0; i < dates.length; i++) {
    while (
      fxIdx < fxTicker.dates.length &&
      !isSameDay(fxTicker.dates[fxIdx], dates[i]) &&
      fxTicker.dates[fxIdx] < dates[i]
    ) {
      const val = fxTicker.values[fxIdx];
      if (!isNaN(val) && val > 0) lastKnownRate = val;
      fxIdx++;
    }
    if (fxIdx < fxTicker.dates.length && isSameDay(fxTicker.dates[fxIdx], dates[i])) {
      const val = fxTicker.values[fxIdx];
      if (!isNaN(val) && val > 0) lastKnownRate = val;
      fxIdx++;
    }
    if (!isNaN(lastKnownRate)) rates[i] = lastKnownRate;
  }

  // Find the first valid rate to fill any NaNs before it.
  let firstKnown = NaN;
  for (let i = 0; i < rates.length; i++) {
    if (!isNaN(rates[i])) { firstKnown = rates[i]; break; }
  }

  if (isNaN(firstKnown)) {
    throw new Error(
      `No FX rate data available for ${fxTicker.name}. ` +
      `Ensure the symbol is valid and Yahoo Finance data has loaded.`
    );
  }

  // Backward pass: fill any NaNs at the start from the first known rate.
  for (let i = 0; i < rates.length && isNaN(rates[i]); i++) {
    rates[i] = firstKnown;
  }

  return rates;
}

export interface PortfolioState {
  transactions: Transactions;
  stocks: { [ticker: string]: Stock };
  dates: Date[];
  summary: Summary;
  currencies: string[];
}

export interface PortfolioComputedState extends PortfolioState {
  portfolioId: string;
  portfolioName: string;
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
  tickers: { [ticker: string]: Ticker },
  displayCurrency?: string
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

    const portfolioValuesNative = getPortfolioValues(
      dates,
      stock.chartData.stock.aggregatedAmounts,
      ticker
    );

    // Apply FX conversion when the stock is denominated in a currency other
    // than the display currency and a matching FX ticker is available.
    const { yahooTicker: fxSymbol, fxMultiplier } = displayCurrency
      ? getFxTickerForConversion(stock.currency.value, displayCurrency)
      : {};
    const fxTicker = fxSymbol ? tickers[fxSymbol] : undefined;

    let portfolioValues = portfolioValuesNative;
    let investedForProfit = stock.chartData.stock.aggregatedValues;
    let commissionForProfit = stock.chartData.commission.aggregatedValues;
    let currentSharePrice = getMostRecentValueFromList(ticker.values).value;

    if (fxTicker) {
      const fxRates = getFxRates(dates, fxTicker);
      // fxMultiplier handles sub-unit currencies: GBp (pence) = 0.01 × GBP.
      const m = fxMultiplier ?? 1;
      const scaledRates = m === 1 ? fxRates : fxRates.map(r => r * m);
      portfolioValues = multiplyLists(portfolioValuesNative, scaledRates);
      investedForProfit = multiplyLists(stock.chartData.stock.aggregatedValues, scaledRates);
      commissionForProfit = multiplyLists(stock.chartData.commission.aggregatedValues, scaledRates);
      const lastScaledRate = getMostRecentValueFromList(scaledRates).value;
      currentSharePrice = currentSharePrice * lastScaledRate;
    }

    aggregatedPortfolioValues =
      aggregatedPortfolioValues.length > 0
        ? addLists(aggregatedPortfolioValues, portfolioValues)
        : portfolioValues;
    const portfolioValue = getMostRecentValueFromList(portfolioValues).value;
    portfolioValuesSummary += portfolioValue;

    const profit = subtractLists(
      subtractLists(portfolioValues, investedForProfit),
      commissionForProfit
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
        currentSharePrice,
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

/**
 * Runs computePortfolioState for each portfolio and returns a map keyed by
 * portfolio ID. Used by per-portfolio selectors and the Portfolios page.
 */
export function computeAllPortfolios(
  portfoliosDbo: PortfolioDbo[],
  tickers: { [ticker: string]: Ticker },
  baseCurrency?: string
): { [id: string]: PortfolioComputedState } {
  const result: { [id: string]: PortfolioComputedState } = {};
  for (const portfolio of portfoliosDbo) {
    result[portfolio.id] = {
      ...computePortfolioState(portfolio.transactions, tickers, baseCurrency),
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
    };
  }
  return result;
}
