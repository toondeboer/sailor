// TODO(cutover): the SAM stack (investments-tracker-prod) creates a NEW API
// Gateway, so both URLs below must be repointed before this is deployed.
// After `sam deploy --config-env prod`, get the new id from the stack outputs:
//   sam list stack-outputs --stack-name investments-tracker-prod --region us-east-1
// and replace REPLACE_WITH_API_ID below (both endpoints share the one API Gateway,
// stage `prod`). DO NOT merge with the placeholder in place.
export const environment = {
  production: true,
  baseUrl: 'https://investments-tracker.toondeboer.com',
  yahooLambdaUrl:
    'https://REPLACE_WITH_API_ID.execute-api.us-east-1.amazonaws.com/prod/yahoo_finance',
  dynamoDBLambdaUrl:
    'https://REPLACE_WITH_API_ID.execute-api.us-east-1.amazonaws.com/prod/microservice',
};
