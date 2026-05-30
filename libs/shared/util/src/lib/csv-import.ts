import {
  CsvInput,
  CsvInputEnglish,
  Transaction,
  Transactions,
} from './types';

function isCsvInputEnglish(
  input: CsvInput | CsvInputEnglish
): input is CsvInputEnglish {
  return (
    typeof input[0] == 'object' &&
    input[0] != null &&
    'Date' in input[0] &&
    'Description' in input[0] &&
    '' in input[0] &&
    'Product' in input[0]
  );
}

export function translateToDutch(csv: CsvInput | CsvInputEnglish): CsvInput {
  if (isCsvInputEnglish(csv)) {
    return csv.map((row) => ({
      Omschrijving: row.Description,
      Datum: row.Date,
      '': row[''],
      Product: row.Product,
    }));
  }

  return csv;
}

function getTickerFromGiroProduct(product: string): string {
  if (product == 'VANGUARD S&P 500 UCITS ETF USD') {
    return 'VUSA.AS';
  }
  return 'VUSA.AS';
}

export function parseCsvInput(csv: CsvInput): Transactions {
  const stock: Transaction[] = [];
  const dividend: Transaction[] = [];
  const commission: Transaction[] = [];

  for (const row of csv) {
    if (!row.Omschrijving || !row.Datum || !row['']) {
      continue;
    }

    const product = row.Product;
    const ticker = getTickerFromGiroProduct(product);

    if (row.Omschrijving.startsWith('Koop ')) {
      stock.push({
        ticker,
        type: 'stock',
        date: new Date(
          parseInt(row.Datum.split('-')[2]),
          parseInt(row.Datum.split('-')[1]) - 1,
          parseInt(row.Datum.split('-')[0])
        ),
        amount: parseFloat(
          row.Omschrijving.replace('Koop ', '').split(' @')[0]
        ),
        value: Math.abs(parseFloat(row[''])),
        currency: 'EUR',
      });
    }
    if (
      row.Omschrijving === 'DEGIRO Transactiekosten en/of kosten van derden'
    ) {
      commission.push({
        ticker,
        type: 'commission',
        date: new Date(
          parseInt(row.Datum.split('-')[2]),
          parseInt(row.Datum.split('-')[1]) - 1,
          parseInt(row.Datum.split('-')[0])
        ),
        amount: 1,
        value: Math.abs(parseFloat(row[''])),
        currency: 'EUR',
      });
    }
    if (row.Omschrijving === 'DEGIRO Verrekening Promotie') {
      commission.push({
        ticker,
        type: 'commission',
        date: new Date(
          parseInt(row.Datum.split('-')[2]),
          parseInt(row.Datum.split('-')[1]) - 1,
          parseInt(row.Datum.split('-')[0])
        ),
        amount: 1,
        value: -1 * Math.abs(parseFloat(row[''])),
        currency: 'EUR',
      });
    }
    if (row.Omschrijving === 'Valuta Creditering') {
      dividend.push({
        ticker,
        type: 'dividend',
        date: new Date(
          parseInt(row.Datum.split('-')[2]),
          parseInt(row.Datum.split('-')[1]) - 1,
          parseInt(row.Datum.split('-')[0])
        ),
        amount: 1,
        value: Math.abs(parseFloat(row[''])),
        currency: 'EUR',
      });
    }
  }

  return { stock, dividend, commission };
}
