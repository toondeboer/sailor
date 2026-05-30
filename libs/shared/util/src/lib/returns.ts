import { Return, Ticker } from './types';
import {
  getMostRecentValueAtIndex,
  getMostRecentValueFromList,
  isSameDay,
} from './core';

export function getYieldPerYear(
  dates: Date[],
  portfolioValues: number[],
  profitValues: number[]
): { years: string[]; yields: number[]; profit: number[] } {
  const years: string[] = [];
  const yields: number[] = [];
  const profit: number[] = [];
  let profitLastYear = 0;
  dates.forEach((date, index) => {
    if (
      (date.getMonth() === 11 && date.getDate() === 31) ||
      index + 1 === dates.length
    ) {
      years.push(date.getFullYear().toString());
      const profitThisYear =
        getMostRecentValueAtIndex(profitValues, index) - profitLastYear;
      profit.push(profitThisYear);
      yields.push(
        (100 * profitThisYear) /
          getMostRecentValueAtIndex(portfolioValues, index)
      );
      profitLastYear = profitThisYear;
    }
  });
  return { years, yields, profit };
}

export function getPortfolioValues(
  dates: Date[],
  aggregatedAmounts: number[],
  ticker: Ticker
): number[] {
  const values: number[] = [];
  let index = 0;
  let currentDate: Date = ticker.dates[index];
  let currentValue: number = ticker.values[index];

  for (let i = 0; i < dates.length; i++) {
    if (!isSameDay(dates[i], currentDate)) {
      if (values.length === 0 || values[values.length - 1] === 0) {
        values.push(0);
      } else {
        values.push(NaN);
      }
    } else {
      let newValue = 0;
      while (isSameDay(dates[i], currentDate)) {
        newValue += currentValue * aggregatedAmounts[i];
        index += 1;
        if (index >= ticker.values.length) {
          break;
        }
        currentDate = ticker.dates[index];
        currentValue = ticker.values[index];
      }

      values.push(newValue);
    }
  }
  return values;
}

export function getReturn(
  portfolioValues: number[],
  profit: number[],
  days: number
): Return {
  const mostRecentProfit = getMostRecentValueFromList(profit);
  const profitDaysAgo = getMostRecentValueFromList(
    profit.slice(
      0,
      mostRecentProfit.index - days < 0 ? 0 : mostRecentProfit.index - days
    )
  );
  const absolute = mostRecentProfit.value - profitDaysAgo.value;
  const mostRecentPortfolioValue =
    getMostRecentValueFromList(portfolioValues).value;

  return {
    absolute,
    percentage:
      mostRecentPortfolioValue !== 0
        ? (absolute / mostRecentPortfolioValue) * 100
        : 0,
  };
}
