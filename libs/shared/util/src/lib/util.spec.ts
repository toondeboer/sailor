import { CsvInput, Transactions } from './types';
import { parseCsvInput } from './util';

describe('parseCsvInput', () => {
  const product = 'VANGUARD S&P 500 UCITS ETF USD';

  // Build a single DEGIRO CSV row (Dutch column names + the unnamed amount column).
  function row(
    Datum: string,
    Omschrijving: string,
    amount: string
  ): CsvInput[number] {
    return { Datum, Product: product, Omschrijving, '': amount };
  }

  it('parses a "Koop" row into a stock transaction', () => {
    const result = parseCsvInput([
      row('03-10-2023', 'Koop 6 @ 77,177 EUR', '-463.06'),
    ]);

    const expected: Transactions = {
      stock: [
        {
          ticker: 'VUSA.AS',
          type: 'stock',
          date: new Date(2023, 9, 3),
          amount: 6,
          value: 463.06,
          currency: 'EUR',
        },
      ],
      dividend: [],
      commission: [],
    };

    expect(result).toEqual(expected);
  });

  it('parses commission, promotion and dividend rows', () => {
    const result = parseCsvInput([
      row(
        '04-10-2023',
        'DEGIRO Transactiekosten en/of kosten van derden',
        '-1.50'
      ),
      row('05-10-2023', 'DEGIRO Verrekening Promotie', '-2.00'),
      row('06-10-2023', 'Valuta Creditering', '12.34'),
    ]);

    expect(result.commission).toEqual([
      {
        ticker: 'VUSA.AS',
        type: 'commission',
        date: new Date(2023, 9, 4),
        amount: 1,
        value: 1.5,
        currency: 'EUR',
      },
      // A promotion credit is a negative "commission" (it reduces costs).
      {
        ticker: 'VUSA.AS',
        type: 'commission',
        date: new Date(2023, 9, 5),
        amount: 1,
        value: -2,
        currency: 'EUR',
      },
    ]);
    expect(result.dividend).toEqual([
      {
        ticker: 'VUSA.AS',
        type: 'dividend',
        date: new Date(2023, 9, 6),
        amount: 1,
        value: 12.34,
        currency: 'EUR',
      },
    ]);
    expect(result.stock).toEqual([]);
  });

  it('skips rows missing a date, description or amount', () => {
    const result = parseCsvInput([
      row('', 'Koop 6 @ 77,177 EUR', '-463.06'),
      row('03-10-2023', '', '-463.06'),
      row('03-10-2023', 'Koop 6 @ 77,177 EUR', ''),
    ]);

    const expected: Transactions = { stock: [], dividend: [], commission: [] };
    expect(result).toEqual(expected);
  });
});
