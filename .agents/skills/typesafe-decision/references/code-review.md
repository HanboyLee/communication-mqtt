# Code Review and Completion Verification

## Applicability

Use for meaningful code changes, regression-prone edits, shared interfaces, security-sensitive behavior, and FRD verification. Use proportionate checks for simple documentation or formatting changes unless project rules require more.

## 1. Requirements and source

Extract observable acceptance criteria and required evidence. Inspect relevant source files. When dependency relationships matter, use available repository search or an optional code graph tool (such as CodeGraph) to find definitions, callers, and affected modules. Check index freshness if relevant. Without CodeGraph, ordinary source inspection is valid; never claim the graph was consulted.

## 2. Implement and test

The main coding agent makes the change and adds appropriate regression coverage. Inspect project configuration to choose actual test, type-check, lint, build, or E2E commands. Capture the real Git diff and command results, including skipped and failed checks. Do not manufacture test results.

## 3. Optional Jev review

If Jev MCP is connected, select the proper tool:

- `jev_review`: patch review against requirements, diff, and test evidence; does **not** execute tests or apply a patch.
- `jev_verify`: claim verification when there is no patch to review.
- `jev_gate`: review both patch and explicit completion claims. Supply relevant diff excerpts and test logs in the **evidence** input too when the tool contract requires them for claim verification; merely placing them in other request fields is insufficient.

Use concrete, individually verifiable completion claims. An agent's statement of success is not evidence.

If Jev is unavailable, use an authorized alternative and report any Jev-specific mandatory gate as incomplete, not passed.

## 4. Review outcome

Investigate uncertain or contradictory findings; fix confirmed issues; rerun affected tests; repeat the review only when code or evidence meaningfully changes. A favorable probabilistic review never overrides a failing deterministic test.

## 5. Report and enforcement

Report changed files, tests actually executed, dependency analysis if actually performed, evidence-backed completion status, Jev results if invoked, and outstanding limitations. Markdown instructions alone cannot enforce a non-skippable check; use supported CI, hooks, or orchestration when enforcement is required.
