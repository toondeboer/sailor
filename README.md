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
sam build
sam local start-api
```

This serves the Lambda functions on `http://localhost:3000`. `sam build` installs each Lambda's
dependencies (including `jwks-rsa`, used for token verification) and `sam local start-api` reads
configuration — Cognito user-pool/client IDs and allowed CORS origins — from `template.yaml`.

> **Note:** the DynamoDB Lambda verifies the Cognito **ID token** on every request, so it needs
> internet access to fetch the Cognito JWKS, and you must be signed in through the frontend (which
> supplies a valid token). Re-run `sam build` whenever you change a Lambda's code or dependencies.

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

## Deployment

CI (`buildspec.yml`) builds the frontend, bundles each Lambda into a single self-contained file
with esbuild (`libs/backend/lambdas/build.mjs`), and deploys the functions with
`aws lambda update-function-code`. The frontend bundle is published as the build artifact.

> **Production configuration:** the Lambdas read `ALLOWED_ORIGINS`, `COGNITO_USER_POOL_ID` and
> `COGNITO_CLIENT_ID` from their environment. `template.yaml` sets dev-friendly defaults; the
> deployed functions should have these set to the production values (the deploy step updates code
> only, not configuration).
