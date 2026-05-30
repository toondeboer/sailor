import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

let dynamoDB;

// --- Cognito JWT verification config ---
// Values default to the known dev pool but should be supplied via environment
// variables per deployment. AWS_REGION is provided by the Lambda runtime.
const region = process.env.AWS_REGION || 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-1_liCB4LgDE';
const clientId = process.env.COGNITO_CLIENT_ID || '3o34bbl92faeo9ljo11eebtim2';
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const jwks = jwksClient({
  jwksUri: `${issuer}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  rateLimit: true,
});

function getSigningKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, key.getPublicKey());
  });
}

// Verify the Cognito ID token's signature, issuer, audience and expiry.
// Rejects anything that is not a valid, unexpired ID token from our pool.
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      { issuer, audience: clientId, algorithms: ['RS256'] },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else if (decoded.token_use !== 'id') {
          reject(new Error('Invalid token_use; expected an ID token'));
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

// Determine the current environment (default to 'dev')
const currentEnv = process.env.ENVIRONMENT || 'dev';

if (currentEnv === 'dev') {
  console.log('Using local DynamoDB instance...');
  dynamoDB = new DynamoDBDocument(
    new DynamoDB({
      endpoint: 'http://host.docker.internal:8000',
      region: 'us-east-1', // Use the same region as your local setup
      accessKeyId: 'fakeAccessKeyId', // Placeholder for local testing
      secretAccessKey: 'fakeSecretAccessKey', // Placeholder for local testing
    })
  );
} else if (currentEnv === 'prod') {
  console.log('Using AWS DynamoDB...');
  dynamoDB = DynamoDBDocument.from(new DynamoDB());
}

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
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin',
  };
}

const tableName = 'Investment_Tracker';

/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
export const handler = async (event) => {
  // NB: never log the full event — event.headers.Authorization is the user's JWT.
  const headers = buildHeaders(event);

  // Answer the CORS preflight before auth: browsers omit the Authorization
  // header on OPTIONS, so gating it behind auth would 401 every preflight.
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, body: '', headers };
  }

  let body;
  let statusCode = '200';

  let userId;

  try {
    // Extract JWT from Authorization header
    const token = event.headers.Authorization || event.headers.authorization;
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized: Missing token' }),
        headers,
      };
    }

    // Verify the token signature/claims (NOT just decode) before trusting `sub`
    const decodedToken = await verifyToken(token);

    // Extract user information from the verified claims
    userId = decodedToken.sub; // Cognito user id (subject)
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: `Unauthorized: ${error.message}` }),
      headers,
    };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        body = (
          await dynamoDB.query({
            TableName: tableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId,
            },
          })
        ).Items[0].transactions;
        break;
      case 'PUT':
        body = (
          await dynamoDB.update({
            TableName: tableName,
            Key: {
              userId: userId,
            },
            UpdateExpression: 'set transactions = :t',
            ExpressionAttributeValues: {
              ':t': event.body,
            },
            ReturnValues: 'ALL_NEW',
          })
        ).Attributes.transactions;
        break;
      default:
        throw new Error(`Unsupported method "${event.httpMethod}"`);
    }
  } catch (err) {
    statusCode = '400';
    body = err.message;
    console.log(err);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
