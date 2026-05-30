import { parseDatabaseDto, parseYahooObjects } from './schemas';

// parseYahooObjects warns on skipped entries; keep test output clean.
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterAll(() => jest.restoreAllMocks());

describe('parseDatabaseDto', () => {
  const valid = {
    transactions: {
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
      dividend: [],
      commission: [],
    },
  };

  it('accepts a well-formed response and defaults startDate', () => {
    const result = parseDatabaseDto(valid);
    expect(result.transactions.stock).toHaveLength(1);
    expect(result.startDate).toBe('');
  });

  it('keeps startDate and tolerates extra fields', () => {
    const result = parseDatabaseDto({
      ...valid,
      startDate: '2023-01-10',
      extraneous: 'ignored',
    });
    expect(result.startDate).toBe('2023-01-10');
  });

  it('throws when transactions is missing', () => {
    expect(() => parseDatabaseDto({})).toThrow();
  });

  it('throws when a numeric field is the wrong type', () => {
    expect(() =>
      parseDatabaseDto({
        transactions: {
          stock: [
            {
              ticker: 'VUSA.AS',
              type: 'stock',
              date: '2023-01-10',
              amount: 2,
              value: 'not-a-number',
              currency: 'EUR',
            },
          ],
          dividend: [],
          commission: [],
        },
      })
    ).toThrow();
  });
});

describe('parseYahooObjects', () => {
  function validYahoo(symbol = 'VUSA.AS') {
    return {
      symbol,
      data: {
        chart: {
          result: [
            {
              meta: { currency: 'EUR', symbol },
              timestamp: [1696550400],
              indicators: { quote: [{ close: [100, null] }] },
            },
          ],
        },
      },
    };
  }

  it('returns valid entries unchanged', () => {
    const result = parseYahooObjects([validYahoo(), validYahoo('EUR=X')]);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('VUSA.AS');
  });

  it('skips malformed / error entries instead of crashing the batch', () => {
    const result = parseYahooObjects([
      validYahoo(),
      { symbol: 'BAD', error: 'Failed to fetch' }, // Yahoo error entry
      { totally: 'wrong' },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('VUSA.AS');
  });

  it('throws when the payload is not an array', () => {
    expect(() => parseYahooObjects({ not: 'an array' })).toThrow();
  });
});
