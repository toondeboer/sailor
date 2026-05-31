import os

_allowed_origins = [
    o.strip()
    for o in os.environ.get(
        'ALLOWED_ORIGINS',
        'http://localhost:4200,https://sailor.toondeboer.com',
    ).split(',')
    if o.strip()
]


def build_headers(event: dict) -> dict:
    hdrs = event.get('headers') or {}
    request_origin = hdrs.get('origin') or hdrs.get('Origin') or ''
    allow_origin = request_origin if request_origin in _allowed_origins else _allowed_origins[0]
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allow_origin,
        'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Vary': 'Origin',
    }
