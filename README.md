# sailor

Visit the website at [sailor.toondeboer.com](https://sailor.toondeboer.com/)

An [Nx](https://nx.dev) monorepo: an **Angular 19 + NgRx** frontend and **Python AWS Lambda +
DynamoDB** backend (managed with AWS SAM), authenticated with **Cognito**. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the project layout and data flow.

## Prerequisites

- **Node.js 22+**
- **Yarn 1.x** (classic) — the repo uses Yarn workspaces
- **Python 3.13+** — for the Lambda backend
- **Docker** — runs DynamoDB locally
- **AWS SAM CLI** — runs the Lambda APIs locally. With Homebrew:
  ```
  brew install aws-sam-cli
  ```

## Install dependencies

```
yarn install          # frontend + Nx toolchain
pip install -r services/requirements.txt   # Lambda dependencies (for local dev / IDE)
```

## Run locally

The app has three pieces that run together: a local DynamoDB, the Lambda APIs (via SAM), and the
Angular dev server. Run each in its own terminal.

### 1. Start the database (DynamoDB Local)

```
docker-compose up
```

The first time only, create the table:

```
python services/init_dynamodb.py
```

### 2. Start the backend APIs (AWS SAM)

```
sam build
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local sam local start-api
```

`sam build` installs `services/requirements.txt` into the deployment package. `sam local start-api`
then serves the functions on `http://localhost:3000`, reading configuration — Cognito
user-pool/client IDs and allowed CORS origins — from `template.yaml` parameter defaults.

> **AWS credentials:** `sam local` resolves your AWS credentials to inject into the Lambda
> container, so an **expired AWS SSO session makes every request return 502**. The dummy
> `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` above sidestep that — the dev Lambda talks to the
> local DynamoDB with fake credentials and never needs real ones. (Or run `aws sso login` to
> refresh real credentials instead.)

> **Note:** the DynamoDB Lambda verifies the Cognito **ID token** on every request, so it needs
> internet access to fetch the Cognito JWKS, and you must be signed in through the frontend (which
> supplies a valid token). Re-run `sam build` whenever you change Lambda code.

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
| `nx run-many -t test` / `nx test util` | Run unit tests |
| `nx lint <project>` | Lint a project |
| `nx build frontend` | Production build of the frontend |
| `nx affected -t lint test build` | What CI runs on a PR |
| `sam build` | Package the Python Lambdas (what CI does before deploy) |

## CI

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs
`nx affected -t lint test build` on every pull request and on pushes to `main`.

## Deployment (Infrastructure as Code)

The backend is managed as code with AWS SAM/CloudFormation. `template.yaml` defines the two
Lambdas, a single API Gateway and their environment variables; `samconfig.toml` holds the
per-stage deploy settings (stack name, region, and prod parameters — CORS origin, Cognito IDs).

On every push to `main`, CodeBuild (`buildspec.yml`) builds the frontend, runs `sam build` to
package the Python Lambdas, and runs `sam deploy --config-env prod` to update the
`investments-tracker-prod` stack. The frontend bundle is published as the build artifact.

> - The CodeBuild role needs permission to manage CloudFormation, IAM, API Gateway, Lambda and S3.
> - The `Investment_Tracker` DynamoDB table is intentionally **not** managed by the stack (so a
>   deploy can never replace it with an empty table) — the Lambda is only granted access to it.
> - After a deploy, the API URLs come from the stack Outputs (`YahooEndpoint` /
>   `MicroserviceEndpoint`); they are baked into `apps/frontend/src/environments/environment.prod.ts`.
