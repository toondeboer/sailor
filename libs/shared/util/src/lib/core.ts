// Numeric-list and date primitives shared across the portfolio calculations.

export function getDailyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(start);
  currentDate.setDate(currentDate.getDate() - 1);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getQuarter(month: number): number {
  return Math.floor(month / 3);
}

export function getMostRecentValueFromList(values: number[]): {
  value: number;
  index: number;
} {
  let index = values.length - 1;
  while (index >= 0) {
    if (values[index]) {
      return { value: values[index], index };
    }
    index -= 1;
  }

  return { value: 0, index: 0 };
}

export function getMostRecentValueAtIndex(values: number[], index: number) {
  return getMostRecentValueFromList(values.slice(0, index + 1)).value;
}

export function addLists(
  list1: number[],
  list2: number[],
  nanAsZero = false
): number[] {
  const result = [];
  for (let i = 0; i < list1.length; i++) {
    if (nanAsZero && Number.isNaN(list1[i]) !== Number.isNaN(list2[i])) {
      result.push(
        (Number.isNaN(list1[i]) ? 0 : list1[i]) +
          (Number.isNaN(list2[i]) ? 0 : list2[i])
      );
    } else {
      result.push(list1[i] + list2[i]);
    }
  }
  return result;
}

export function subtractLists(list1: number[], list2: number[]): number[] {
  const result = [];
  for (let i = 0; i < list1.length; i++) {
    result.push(list1[i] - list2[i]);
  }
  return result;
}

export function addPerQuarterByYearLists(
  list1: { year: string; data: number[] }[],
  list2: { year: string; data: number[] }[]
): { year: string; data: number[] }[] {
  const result = [];
  for (let i = 0; i < list1.length; i++) {
    result.push({
      year: list1[i].year,
      data: addLists(list1[i].data, list2[i].data),
    });
  }
  return result;
}
