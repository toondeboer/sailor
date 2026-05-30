import { Ticker, YahooObject } from './types';

export function yahooObjectsToTickers(yahooObjects: YahooObject[]): {
  [ticker: string]: Ticker;
} {
  return yahooObjects.reduce((acc, yahooObject) => {
    acc[yahooObject.symbol] = yahooObjectToTicker(yahooObject);
    return acc;
  }, {} as { [ticker: string]: Ticker });
}

export function yahooObjectToTicker(yahooObject: YahooObject): Ticker {
  const result = yahooObject.data.chart.result[0];
  let dividends: { date: Date; amountPerShare: number }[] = [];
  if (result.events) {
    const dividendEvents = result.events.dividends;
    dividends = Object.keys(dividendEvents).map((key) => ({
      date: new Date(dividendEvents[key].date * 1000),
      amountPerShare: dividendEvents[key].amount,
    }));
  }
  return {
    name: result.meta.symbol,
    currency: result.meta.currency,
    values: result.indicators.quote[0].close.map((v) => (v === null ? NaN : v)),
    dates: result.timestamp.map((time) => new Date(time * 1000)),
    dividends,
  };
}
