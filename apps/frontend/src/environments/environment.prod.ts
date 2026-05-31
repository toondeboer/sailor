// TODO(cutover): after `sam deploy --config-env prod` creates the sailor-prod stack,
// get the new API Gateway id from the stack outputs:
//   sam list stack-outputs --stack-name sailor-prod --region us-east-1
// and replace the API id in both URLs below (both endpoints share one API Gateway,
// stage `prod`). DO NOT merge with a stale API id in place.
export const environment = {
  production: true,
  baseUrl: 'https://sailor.toondeboer.com',
  yahooLambdaUrl:
    'https://jx9de60m0g.execute-api.us-east-1.amazonaws.com/prod/yahoo_finance',
  dynamoDBLambdaUrl:
    'https://jx9de60m0g.execute-api.us-east-1.amazonaws.com/prod/microservice',
};
