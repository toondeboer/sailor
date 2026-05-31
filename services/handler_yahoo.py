import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

from shared.cors import build_headers

_REQUEST_HEADERS = {
    'Accept': '*/*',
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        'AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/120.0.0.0 Safari/537.36'
    ),
}


def _fetch_symbol(args: tuple) -> dict:
    symbol, start, end = args
    url = (
        f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}'
        f'?interval=1d&period1={start}&period2={end}&events=div'
    )
    req = urllib.request.Request(url, headers=_REQUEST_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return {'symbol': symbol, 'data': json.loads(resp.read())}
    except Exception as exc:
        return {'symbol': symbol, 'error': str(exc)}


def handler(event, context):
    headers = build_headers(event)

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'body': '', 'headers': headers}

    try:
        body = json.loads(event.get('body') or '{}')
        symbols: list = body.get('symbols', [])
        start = body.get('start')
        end = body.get('end')
    except Exception:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Invalid JSON body'}),
            'headers': headers,
        }

    if not isinstance(symbols, list) or not symbols:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Request must include a non-empty "symbols" array'}),
            'headers': headers,
        }

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(_fetch_symbol, [(s, start, end) for s in symbols]))

    return {
        'statusCode': 200,
        'body': json.dumps(results),
        'headers': headers,
    }
