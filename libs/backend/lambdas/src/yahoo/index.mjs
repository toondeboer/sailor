import https from 'https';

// Comma-separated allowlist of origins permitted to call this API. A single
// Access-Control-Allow-Origin can only name one origin, so we reflect the
// caller's Origin when it is on the list (supporting local dev + prod at once).
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:4200,https://investments-tracker.toondeboer.com'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function buildHeaders(event) {
  const requestOrigin = event.headers?.origin || event.headers?.Origin || '';
  const allowOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
}

export const handler = async (event) => {
  const headers = buildHeaders(event);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  let symbols, start, end;
  try {
    ({ symbols, start, end } = JSON.parse(event.body ?? '{}'));
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid JSON body' }),
    };
  }

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: 'Request must include a non-empty "symbols" array',
      }),
    };
  }

  // allSettled so one bad symbol can't sink (or hang) the whole batch.
  const settled = await Promise.allSettled(
    symbols.map((symbol) => {
      const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${start}&period2=${end}&events=div`;
      console.log('[Yahoo] Api url: ', apiUrl);
      const options = {
        hostname: 'query1.finance.yahoo.com',
        path: apiUrl,
        method: 'GET',
        headers: {
          Accept: '*/*',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      };

      return new Promise((resolve, reject) => {
        const req = https.get(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(
                new Error(`Yahoo responded ${res.statusCode} for ${symbol}`)
              );
              return;
            }
            try {
              resolve({ symbol, data: JSON.parse(data) });
            } catch (e) {
              reject(new Error(`Failed to parse Yahoo response for ${symbol}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });
    })
  );

  // Preserve the per-symbol shape: failures become { symbol, error } entries
  // instead of dropping the entire response.
  const results = settled.map((outcome, i) =>
    outcome.status === 'fulfilled'
      ? outcome.value
      : { symbol: symbols[i], error: outcome.reason?.message ?? 'Request failed' }
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(results),
  };
};
