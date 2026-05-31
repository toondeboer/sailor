import json
import os
import urllib.request

import jwt
from jwt.algorithms import RSAAlgorithm

_REGION = os.environ.get('AWS_REGION', 'us-east-1')
_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', 'us-east-1_liCB4LgDE')
_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID', '3o34bbl92faeo9ljo11eebtim2')
_ISSUER = f'https://cognito-idp.{_REGION}.amazonaws.com/{_USER_POOL_ID}'
_JWKS_URI = f'{_ISSUER}/.well-known/jwks.json'

# Module-level cache: populated on first call, reused across warm-start invocations.
_jwks_keys: list | None = None


def _get_jwks() -> list:
    global _jwks_keys
    if _jwks_keys is None:
        with urllib.request.urlopen(_JWKS_URI, timeout=5) as resp:
            _jwks_keys = json.loads(resp.read())['keys']
    return _jwks_keys


def _public_key_for_kid(kid: str):
    for key_data in _get_jwks():
        if key_data['kid'] == kid:
            return RSAAlgorithm.from_jwk(json.dumps(key_data))
    raise ValueError(f'No matching JWKS key for kid={kid}')


def verify_token(token: str) -> dict:
    """Verify a Cognito ID token's signature, audience, issuer and expiry.

    Returns the decoded claims dict. Raises on any verification failure.
    """
    header = jwt.get_unverified_header(token)
    public_key = _public_key_for_kid(header['kid'])
    decoded = jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        audience=_CLIENT_ID,
        issuer=_ISSUER,
    )
    if decoded.get('token_use') != 'id':
        raise ValueError('Invalid token_use; expected an ID token')
    return decoded
