import { Ticker, TransactionsDbo } from './types';
import { getDailyDates, getStartDate, transactionsDboToStocks } from './util';
import { computePortfolioState } from './portfolio';

describe('computePortfolioState', () => {
  const dbo: TransactionsDbo = {
    stock: [
      {
        ticker: 'VUSA.AS',
        type: 'stock',
        date: '2023-01-10',
        amount: 2,
        value: 200,
        currency: 'EUR',
      },
    ],
    dividend: [
      {
        ticker: 'VUSA.AS',
        type: 'dividend',
        date: '2023-02-10',
        amount: 1,
        value: 5,
        currency: 'EUR',
      },
    ],
    commission: [
      {
        ticker: 'VUSA.AS',
        type: 'commission',
        date: '2023-01-10',
        amount: 1,
        value: 3,
        currency: 'EUR',
      },
    ],
  };

  it('derives transaction data (no prices yet)', () => {
    const result = computePortfolioState(dbo, {});

    expect(Object.keys(result.stocks)).toEqual(['VUSA.AS']);
    expect(result.transactions.stock).toHaveLength(1);
    expect(result.dates.length).toBeGreaterThan(0);

    // Aggregated, carried-forward totals.
    expect(result.summary.totalInvested).toBe(200);
    expect(result.summary.totalDividend).toBe(5);
    expect(result.summary.totalCommission).toBe(3);

    const stock = result.stocks['VUSA.AS'];
    expect(stock.summary.amountOfShares).toBe(2);
    expect(stock.summary.averageSharePrice).toBe(100); // 200 / 2

    // No tickers -> no price-derived values.
    expect(result.summary.portfolioValue).toBe(0);
    expect(stock.chartData.portfolioValues).toEqual([]);
  });

  it('adds price-derived data once tickers are present', () => {
    // Build a ticker whose dates line up exactly with the computed daily dates
    // and a flat price of 150, so values are deterministic regardless of range.
    const dates = getDailyDates(
      getStartDate(transactionsDboToStocks(dbo)),
      new Date()
    );
    const ticker: Ticker = {
      name: 'VUSA.AS',
      currency: 'EUR',
      dates,
      values: dates.map(() => 150),
      dividends: [],
    };

    const result = computePortfolioState(dbo, { 'VUSA.AS': ticker });
    const stock = result.stocks['VUSA.AS'];

    // 2 shares * 150 at the most recent day.
    expect(result.summary.portfolioValue).toBe(300);
    expect(stock.summary.portfolioValue).toBe(300);
    expect(stock.summary.currentSharePrice).toBe(150);

    // Stage-1 totals are preserved through stage 2.
    expect(stock.summary.totalInvested).toBe(200);
    expect(stock.chartData.portfolioValues).toHaveLength(dates.length);
  });

  it('returns an empty portfolio for no transactions', () => {
    const result = computePortfolioState(
      { stock: [], dividend: [], commission: [] },
      {}
    );

    expect(result.stocks).toEqual({});
    expect(result.dates).toEqual([]);
    expect(result.currencies).toEqual([]);
    expect(result.summary.totalInvested).toBe(0);
    expect(result.summary.portfolioValue).toBe(0);
  });
});
