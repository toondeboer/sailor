# CLAUDE.md

Guidance for AI agents working in this repo. Read [README.md](README.md) (setup / run / deploy
commands) and [ARCHITECTURE.md](ARCHITECTURE.md) (projects + data flow) first — this file only
covers conventions and gotchas that aren't obvious from the code.

## Hard invariants (breaking these still compiles, but breaks the app)

- **`AppComponent` must stay non-standalone**, declared in `AppModule`
  (`apps/frontend/src/app/`). It is bootstrapped via the NgModule; making it standalone passes the
  AOT production build but breaks `nx serve` (dev / JIT) with _"AppModule needs the JIT compiler"_.
  There is a deliberate `eslint-disable @angular-eslint/prefer-standalone` on it — leave it.
- **The `state` lib must never import from the `yahoo` lib.** That's a circular lib dependency
  (`yahoo` already imports `state`). Prices reach `state` via the `setChartData` **action** that the
  yahoo effect dispatches — never read the yahoo slice from a `state` selector.
- **The `state` reducer stores only raw inputs** (`transactionsDbo`, `tickers`, plus
  `loading`/`error`/`lastFetched`). Everything derived (stocks, summary, chart data) is computed in
  the memoized `selectPortfolio` selector via `computePortfolioState()` in
  `libs/shared/util/src/lib/portfolio.ts`. **Put new portfolio logic there, not in the reducer.**
- **No `console.log`.** They were all removed; tests assume clean output. Never log the Lambda
  `event` or any token — it leaks the user's JWT to CloudWatch. Use `console.warn`/`console.error`
  only for genuine diagnostics.

## Where new code goes

- **Domain / financial calculations** → a module in `libs/shared/util/src/lib/` (`core`,
  `transactions`, `dividends`, `returns`, `csv-import`, `yahoo-mapping`). `util.ts` is just a barrel
  re-exporting them — don't add code to it. Add a hand-traced unit test in the matching `*.spec.ts`.
- **HTTP-boundary validation** → zod schemas in `schemas.ts` (already used by the services).
- **HTTP resilience** (timeout / retry-backoff) → `http-resilience.ts` (already wired into the services).
- **Shared styles** → `apps/frontend/src/styles/` (`_tokens`, `_mixins`, `_globals`), usable from any
  component via `@use 'tokens'` (`includePaths` is configured in the build).

## Testing

- The financial core (`nx test util`) is where real coverage lives. Tests **hand-trace expected
  values** (no snapshots) and avoid hardcoding the current year (functions use real `new Date()`).
- Component `*.spec.ts` are intentionally **lightweight "should create" smoke tests**: standalone
  component in `imports:` + only the providers it injects (`provideMockStore()`, `provideRouter([])`,
  `{ provide: 'ENVIRONMENT', useValue: {...} }`, an `OidcSecurityService` stub) and **no
  `fixture.detectChanges()`** (avoids rendering / `ngOnInit` side-effects). The ui `test-setup.ts`
  enables `errorOnUnknownElements` and polyfills `matchMedia`. Follow this pattern for new components.
- `*.spec.ts` are excluded from the app build, so **`nx build frontend` is the real typecheck**
  (`strict` is on).

## Build / deploy gotchas

- **Lambdas are Python 3.13** (`services/`). `sam build` installs `services/requirements.txt` into
  each function's deployment package — run it before `sam local start-api` or deploy. `boto3` is
  provided by the Lambda runtime and is not in `requirements.txt`.
- **CORS is handled in the Lambda**, not API Gateway: an origin allowlist that reflects the request
  `Origin`, and both routes use `Method: any` so the Lambda answers the `OPTIONS` preflight **before**
  the auth check (browsers omit `Authorization` on preflight).
- **The DynamoDB GET response body is the stored JSON string** — `setTransactions` posts
  `{ transactions }`, which is stored verbatim and returned, so `response.transactions` is a
  `TransactionsDbo`. Don't "fix" the serialization without tracing that round-trip.
- The `Investment_Tracker` table is **referenced, not managed** by the SAM stack (so a deploy can't
  wipe data).
- Auth: the frontend sends the raw Cognito **ID token** (no `Bearer` prefix) in `Authorization`; the
  Lambda **verifies** it against the Cognito JWKS (`jwt.decode` with `algorithms=['RS256']` via
  PyJWT, not just `get_unverified_claims`). JWKS keys are cached at module level for warm starts.

## Workflow

- Work in small, focused branches off `main` + PRs; never commit to `main` directly. CI
  (`nx affected -t lint test build`) gates merges.
- Before pushing, run `nx run-many -t lint test build --all` — green across all 5 JS projects is the bar.
- `strict` and `noImplicitOverride` are on; **`noUncheckedIndexedAccess` is deliberately off** — it's
  the one remaining (optional) hardening item, best done module-by-module across `libs/shared/util`.
- **After every set of changes: commit and open a PR.** The user reviews by commenting on the PR or
  making a separate follow-up commit if they disagree — never hold back a commit waiting for verbal
  approval.
