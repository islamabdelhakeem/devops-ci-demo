# Practical CI Exercise (Demo Only)

You are given a small Node service and a basic GitHub Actions workflow that runs but lacks guardrails.

## Goal
Improve the GitHub Actions workflow to be production-grade without deployment.

## Requirements
1. Add linting and unit tests (fail the workflow on errors).
2. Use `npm ci` and add dependency caching.
3. Generate and upload artifacts (at minimum: coverage output and a small build artifact).
4. Add at least one security/supply-chain check (choose one):
   - npm audit
   - dependency review action
   - CodeQL
5. Demonstrate safe handling of a secret:
   - Add a repository secret named `DEMO_API_KEY`
   - Use it in the workflow (e.g., for a step/test) without printing it.
6. Add a gated “release” job that only runs on tags like `v*` OR via manual trigger,
   and attaches build artifacts to the workflow run (no deployment).

## Deliverables
- Updated `.github/workflows/ci.yml`
- A short `CI_NOTES.md` explaining what you changed and why
