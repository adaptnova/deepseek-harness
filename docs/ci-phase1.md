# CI — phase1 plane (2026-08-16, SP-027)

CI runs on the personal-account mirror `LiquidMovz/deepseek-harness` (exact-SHA,
Jira/org-plane pending). Lane: `LiquidMovz/ci-library` `verify-node-pnpm.yml`
(pnpm workspace: frozen-lockfile install, gitleaks, lint, typecheck, test,
build). Wiring source: Forge platform-ci kit; wrapper: `.github/workflows/ci.yml`.
