# Investments Tracker

Visit the website at [investments-tracker.toondeboer.com](https://investments-tracker.toondeboer.com/)

An [Nx](https://nx.dev) monorepo: an **Angular 19 + NgRx** frontend, an **AWS Lambda + DynamoDB**
backend (managed with AWS SAM), and **Cognito** authentication.

## Prerequisites

- **Node.js 22+**
- **Yarn 1.x** (classic) — the repo uses Yarn workspaces
- **Docker** — runs DynamoDB locally
- **AWS SAM CLI** — runs the Lambda APIs locally. With Homebrew:
  ```
  brew install aws-sam-cli
  ```

## Install dependencies

```
yarn install
```

This installs the frontend **and** the Lambda dependencies (the Lambda packages are Yarn
workspace members).

## Run locally

The app has three pieces that run together: a local DynamoDB, the Lambda APIs (via SAM), and the
Angular dev server. Run each in its own terminal.

### 1. Start the database (DynamoDB Local)

```
docker-compose up
```

The first time only, create the table:

```
node libs/backend/lambdas/src/dynamodb/init-dynamodb.js
```

### 2. Start the backend APIs (AWS SAM)

```
node libs/backend/lambdas/build.mjs
sam local start-api
```

`build.mjs` bundles each Lambda (with its dependencies, e.g. `jwks-rsa`) into a single file under
`dist/lambdas/<name>/`, which is where `template.yaml`'s `CodeUri` points. `sam local start-api`
then serves the functions on `http://localhost:3000`, reading configuration — Cognito
user-pool/client IDs and allowed CORS origins — from `template.yaml` parameter defaults.

> **Note:** the DynamoDB Lambda verifies the Cognito **ID token** on every request, so it needs
> internet access to fetch the Cognito JWKS, and you must be signed in through the frontend (which
> supplies a valid token). Re-run `node libs/backend/lambdas/build.mjs` whenever you change a
> Lambda's code.

### 3. Start the frontend

```
nx serve frontend
```

Open `http://localhost:4200`. The dev server proxies `/microservice` and `/yahoo_finance` to the
SAM APIs on `:3000` (see `apps/frontend/proxy.conf.json`).

## Useful commands

| Command | What it does |
| --- | --- |
| `nx serve frontend` | Run the app with hot reload |
| `nx test util` / `nx run-many -t test` | Run unit tests |
| `nx lint <project>` | Lint a project |
| `nx build frontend` | Production build of the frontend |
| `node libs/backend/lambdas/build.mjs` | Bundle the Lambdas (what CI does before deploy) |

## Deployment (Infrastructure as Code)

The backend is managed as code with AWS SAM/CloudFormation. `template.yaml` defines the two
Lambdas, a single API Gateway, and their environment variables; `samconfig.toml` holds the
per-environment deploy settings (stack name, region, parameters).

CI (`buildspec.yml`) builds the frontend, bundles the Lambdas (`libs/backend/lambdas/build.mjs`),
and runs `sam deploy --config-env prod` to provision/update the whole stack. The frontend bundle
is published as the build artifact. Production parameters (prod CORS origin, Cognito IDs) live in
`samconfig.toml`'s `[prod.deploy.parameters]`.

> **CodeBuild role:** `sam deploy` needs permission to manage CloudFormation, IAM, API Gateway,
> Lambda and S3 — broader than the old `update-function-code` flow. Grant these to the CodeBuild
> service role before the first CI deploy.

### One-time migration to the SAM stack

The original prod functions and API Gateways were created by hand; the SAM stack is a fresh set of
resources with **new** API URLs, so a one-time cutover is required:

1. Ensure the CodeBuild (or your local) role has the permissions above, then deploy the stack:
   ```
   node libs/backend/lambdas/build.mjs
   sam deploy --config-env prod
   ```
2. Read the stack **Outputs** (`YahooEndpoint`, `MicroserviceEndpoint`) — e.g.
   `sam list stack-outputs --stack-name investments-tracker-prod` — and paste them into
   `apps/frontend/src/environments/environment.prod.ts` (`yahooLambdaUrl`, `dynamoDBLambdaUrl`).
3. Rebuild and redeploy the frontend so it points at the new endpoints.
4. Once verified, delete the **old** hand-made `yahoo_finance` / `microservice` functions and their
   API Gateways.

> The existing **`Investment_Tracker` DynamoDB table is intentionally not managed by the stack** so
> a deploy can never replace it with an empty table — the function is only granted access to it.
> Cognito callback URLs point at the frontend domain (unchanged), so no Cognito changes are needed.
