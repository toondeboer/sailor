"""Creates the sailor table in DynamoDB Local for development.

Usage:
    python services/init_dynamodb.py
"""
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.client(
    'dynamodb',
    endpoint_url='http://localhost:8000',
    region_name='us-east-1',
    aws_access_key_id='fake',
    aws_secret_access_key='fake',
)

TABLE_NAME = 'sailor'

try:
    dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[{'AttributeName': 'userId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'userId', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST',
    )
    print(f'Table "{TABLE_NAME}" created.')
except ClientError as e:
    if e.response['Error']['Code'] == 'ResourceInUseException':
        print(f'Table "{TABLE_NAME}" already exists.')
    else:
        raise
