export type Summary = {
  portfolioValue: number;
  totalInvested: number;
  totalDividend: number;
  totalCommission: number;
  startDate: Date;
  dailyReturn: Return;
  weeklyReturn: Return;
  monthlyReturn: Return;
  totalReturn: Return;
};

export type Return = {
  absolute: number;
  percentage: number;
};

export type StockSummary = {
  portfolioValue: number;
  totalInvested: number;
  totalDividend: number;
  totalCommission: number;
  amountOfShares: number;
  averageSharePrice: number;
  currentSharePrice: number;
  dailyReturn: Return;
  weeklyReturn: Return;
  monthlyReturn: Return;
  totalReturn: Return;
};

export type Stock = {
  ticker: string;
  transactions: Transactions;
  summary: StockSummary;
  chartData: ChartData;
  currency: {
    value: string;
    yahooTicker?: string;
    // Multiplier applied after the FX rate conversion. Used for sub-unit
    // currencies where Yahoo prices differ from the exchange rate unit:
    // GBp (pence) = 0.01 × GBP, so fxMultiplier is 0.01.
    fxMultiplier?: number;
  };
};

export type ChartData = {
  stock: TransactionChartData;
  dividend: DividendTransactionChartData;
  commission: TransactionChartData;
  portfolioValues: number[];
  profit: number[];
  yieldPerYear: { years: string[]; yields: number[]; profit: number[] };
};

export type TransactionChartData = {
  transactionValues: number[];
  aggregatedValues: number[];
  transactionAmounts: number[];
  aggregatedAmounts: number[];
};

export interface DividendTransactionChartData extends TransactionChartData {
  perQuarterByYear: { year: string; data: number[] }[];
  perQuarter: { yearQuarters: YearQuarter[]; dividends: number[] };
  ttmPerQuarter: { yearQuarters: YearQuarter[]; dividends: number[] };
}

export type TransactionType = 'stock' | 'dividend' | 'commission';

export type Transactions = {
  stock: Transaction[];
  dividend: Transaction[];
  commission: Transaction[];
};

export type Transaction = {
  ticker: string;
  type: TransactionType;
  date: Date;
  time?: string;
  amount: number;
  value: number;
  currency: string;
};

export type TransactionKey = {
  type: TransactionType;
  ticker: string;
  date: string;
  time?: string;
  value: number;
};

// Legacy v1 shape — kept for schema migration only.
export type DatabaseDtoV1 = {
  startDate: string;
  transactions: TransactionsDbo;
};

export type UserSettingsDbo = {
  baseCurrency: string;
};

export type PortfolioDbo = {
  id: string;
  name: string;
  transactions: TransactionsDbo;
};

export type DatabaseDto = {
  portfolios: PortfolioDbo[];
  settings: UserSettingsDbo;
  schemaVersion: 2;
};

export type TransactionsDbo = {
  stock: TransactionDbo[];
  dividend: TransactionDbo[];
  commission: TransactionDbo[];
};

export type TransactionDbo = {
  ticker: string;
  type: string;
  date: string;
  time?: string;
  amount: number;
  value: number;
  currency: string;
};

export type YahooObject = {
  symbol: string;
  data: {
    chart: {
      result: [
        {
          events?: {
            dividends: {
              [timestamp: string]: { amount: number; date: number };
            };
          };
          meta: {
            currency: string;
            symbol: string;
          };
          timestamp: number[];
          indicators: {
            quote: [
              {
                low: number[];
                high: number[];
                volume: number[];
                close: number[];
                open: number[];
              }
            ];
            adjclose: [{ adjclose: number[] }];
          };
        }
      ];
    };
  };
};

export type Ticker = {
  name: string;
  currency: string;
  dates: Date[];
  values: number[];
  dividends: { date: Date; amountPerShare: number }[];
};

export type CsvInput = {
  Datum: string;
  Tijd?: string;
  Product: string;
  Omschrijving: string;
  '': string;
}[];

export type CsvInputEnglish = {
  Date: string;
  Time?: string;
  Product: string;
  Description: string;
  '': string;
}[];

export type YearQuarter = {
  year: string;
  quarter: number;
};
