import { z } from 'zod';
import { DatabaseDto, YahooObject } from './types';

// Runtime validation for data crossing a trust boundary (HTTP responses).
// Without this, a malformed payload is cast to its TypeScript type and flows
// straight into the financial math, where missing fields become NaN money.

// --- DynamoDB API (our backend) -------------------------------------------

const transactionDboSchema = z
  .object({
    ticker: z.string(),
    type: z.string(),
    date: z.string(),
    amount: z.number(),
    value: z.number(),
    currency: z.string(),
  })
  // Keep any extra columns the backend may add rather than stripping them.
  .passthrough();

const transactionsDboSchema = z.object({
  stock: z.array(transactionDboSchema),
  dividend: z.array(transactionDboSchema),
  commission: z.array(transactionDboSchema),
});

const databaseDtoSchema = z
  .object({
    startDate: z.string().optional().default(''),
    transactions: transactionsDboSchema,
  })
  .passthrough();

/**
 * Validate the DynamoDB response before it enters the store. Throws a ZodError
 * on a malformed shape, which the effect maps to a *Failure action (and a user
 * facing error toast) instead of silently feeding bad data into the reducer.
 */
export function parseDatabaseDto(raw: unknown): DatabaseDto {
  return databaseDtoSchema.parse(raw) as DatabaseDto;
}

// --- Yahoo Finance (external) ---------------------------------------------

const yahooObjectSchema = z.object({
  symbol: z.string(),
  data: z.object({
    chart: z.object({
      result: z
        .array(
          z.object({
            meta: z.object({ currency: z.string(), symbol: z.string() }),
            timestamp: z.array(z.number()),
            events: z
              .object({
                dividends: z.record(
                  z.object({ amount: z.number(), date: z.number() })
                ),
              })
              .optional(),
            indicators: z.object({
              quote: z
                .array(z.object({ close: z.array(z.number().nullable()) }))
                .min(1),
            }),
          })
        )
        .min(1),
    }),
  }),
});

/**
 * Validate the Yahoo Lambda response. Yahoo intermittently returns error
 * objects or partial payloads; rather than crash the whole batch in
 * yahooObjectToTicker, keep only the entries matching the expected shape.
 * Throws only when the payload isn't an array at all.
 */
export function parseYahooObjects(raw: unknown): YahooObject[] {
  const entries = z.array(z.unknown()).parse(raw);
  const valid: YahooObject[] = [];
  for (const entry of entries) {
    const result = yahooObjectSchema.safeParse(entry);
    if (result.success) {
      valid.push(result.data as YahooObject);
    } else {
      console.warn('Skipping malformed Yahoo response entry');
    }
  }
  return valid;
}
