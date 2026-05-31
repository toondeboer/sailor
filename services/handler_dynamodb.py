import json
import os

import boto3
from boto3.dynamodb.conditions import Key

from shared.auth import verify_token
from shared.cors import build_headers

_TABLE_NAME = 'sailor'
_CURRENT_SCHEMA_VERSION = 1


def _get_table():
    env = os.environ.get('ENVIRONMENT', 'dev')
    if env == 'dev':
        dynamodb = boto3.resource(
            'dynamodb',
            endpoint_url='http://host.docker.internal:8000',
            region_name='us-east-1',
            aws_access_key_id='fake',
            aws_secret_access_key='fake',
        )
    else:
        dynamodb = boto3.resource('dynamodb')
    return dynamodb.Table(_TABLE_NAME)


def handler(event, context):
    headers = build_headers(event)

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'body': '', 'headers': headers}

    # Auth — verify the Cognito ID token before touching any data.
    token = (event.get('headers') or {}).get('Authorization') or \
            (event.get('headers') or {}).get('authorization')
    if not token:
        return {
            'statusCode': 401,
            'body': json.dumps({'message': 'Unauthorized: Missing token'}),
            'headers': headers,
        }

    try:
        decoded = verify_token(token)
        user_id = decoded['sub']
    except Exception as exc:
        return {
            'statusCode': 401,
            'body': json.dumps({'message': f'Unauthorized: {exc}'}),
            'headers': headers,
        }

    table = _get_table()
    method = event.get('httpMethod')

    try:
        if method == 'GET':
            resp = table.query(KeyConditionExpression=Key('userId').eq(user_id))
            items = resp.get('Items', [])
            if not items:
                # New users have no row yet — return an empty transactions object.
                body = '{}'
            else:
                item = items[0]
                # schemaVersion is absent on pre-migration items (treat as v0).
                # Add per-version migration branches here as the schema evolves.
                _schema_version = int(item.get('schemaVersion', 0))
                body = item.get('transactions', '{}')

        elif method == 'PUT':
            resp = table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET transactions = :t, schemaVersion = :v',
                ExpressionAttributeValues={
                    ':t': event.get('body', '{}'),
                    ':v': _CURRENT_SCHEMA_VERSION,
                },
                ReturnValues='ALL_NEW',
            )
            body = resp['Attributes']['transactions']

        else:
            raise ValueError(f'Unsupported method: {method}')

    except Exception as exc:
        return {'statusCode': 400, 'body': str(exc), 'headers': headers}

    return {'statusCode': 200, 'body': body, 'headers': headers}
