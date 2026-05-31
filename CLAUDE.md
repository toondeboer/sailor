# CLAUDE.md

1. Read README.md and ARCHITECTURE.md before making changes.

## Critical invariants

* AppComponent must remain non-standalone.
* state must never import yahoo.
* Portfolio calculations belong in computePortfolioState(), not reducers.
* The product name is always written **sailor** — all lowercase, including at the start of a sentence or heading.

## Testing

* New business logic must have unit tests.
* Follow existing testing patterns.

## Validation

Run before completion:

nx run-many -t lint test build --all

## Workflow

* Create a branch for changes.
* Commit changes and open a PR.
* Include a manual test checklist in the PR.
* Update documentation only when implementation changes make it inaccurate.
