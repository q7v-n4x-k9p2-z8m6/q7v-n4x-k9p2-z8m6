# Testing Agent — architecture and safety contract

## Current integration

- The Builder panel exposes a separate `testing_agent` tab under **آزمایش و کنترل کیفیت**.
- Access is restricted to the primary `creator` role.
- The panel reuses the existing `builder-ai-assistant` Supabase Edge Function as its planning model. It does not introduce a second LLM, model key, or independent AI conversation service.
- The request includes a bounded snapshot of feature names, keys, locations, critical flags, and current feature status.
- The planner is explicitly instructed to produce test scenarios only. The UI labels every returned plan as **not executed**.
- The current-session history is held in component state only; no test-run records or database schema are created.

## Current limitation

There is no connected browser automation runner in this feature. The existing AI assistant endpoint returns text; it does not navigate the app, click controls, submit forms, inspect browser console/network traffic, or verify persisted records. Therefore the panel intentionally has no active **Run tests** action and must not report PASS/FAIL for an unexecuted scenario.

## Runner contract for a later phase

A future runner adapter must be a separate service from the AI model and must:

1. Accept a structured plan and a dedicated test-environment URL.
2. Refuse production/live URLs and live credentials.
3. Use synthetic test identities and isolated test data only.
4. Default to read-only navigation and inspection.
5. Require explicit approval before any state-changing step.
6. Block external side effects such as real payments, messages, emails, and third-party API calls unless an explicitly isolated mock is configured.
7. Capture step logs, screenshots, console errors, failed requests, viewport dimensions, and expected-versus-actual assertions.
8. Return structured results with run ID, timestamps, PASS/FAIL/WARNING, evidence references, and cleanup status.
9. Never delete or overwrite real user, customer, ledger, cashbox, transfer, journal, or transaction data.

## Data and deployment boundary

This feature branch contains only Builder UI/planning code and this architecture note. It does not change Supabase schema, RLS, auth, financial workflows, production records, or deployment configuration. Do not merge into `main` until the runner is implemented and the complete test suite passes against an isolated test target.
