# Tool Routing and Agent Orchestration

## Core rule

Choose the minimum capabilities needed for the task; avoid calling all installed MCP tools. Use deterministic routing when possible and bounded semantic classification only when task intent is genuinely ambiguous. Check tools are actually connected and authorized before using them.

| Requirement | Capability | Optional implementation |
| --- | --- | --- |
| Exact rule or permission check | Deterministic code | Existing application/runtime |
| Symbols, callers, dependencies | Source search or code graph | CodeGraph |
| Bounded semantic classification | Available judgment model | TypeSafe API/SDK or Jev MCP |
| Claim verification | Evidence-based review | `jev_verify` |
| Diff review | Patch plus actual test evidence | `jev_review` |
| Diff and completion claims | Combined review | `jev_gate` |
| Implementation, debugging, planning | Main agent | Authorized coding tools |
| Irreversible operation | Independent authorization | User approval where required |

## Routing procedure

1. Identify task outcome: read-only, code analysis, modification, verification, or high-risk action.
2. Determine the minimum required evidence and capabilities.
3. Check which tools are available and permitted.
4. Use exact methods for exact questions; use an available judgment runtime only for eligible semantic questions.
5. If classifying a task semantically, use explicit candidates plus a no-match/review exit.
6. Run workflows in dependency order; gather evidence before downstream review.
7. Report actual tool calls and incomplete mandatory steps.

## Example: shared React component bug

1. Inspect requirements and acceptance criteria.
2. Search for the component and callers with CodeGraph if available and relevant, otherwise ordinary repository search.
3. Have the main coding agent implement the fix and update tests.
4. Execute real tests and collect the diff and outputs.
5. Review with Jev if connected and appropriate. For claims in `jev_gate`, provide supporting text as explicit evidence.
6. Resolve confirmed issues and report what was actually verified.

## Fallbacks and boundaries

- No CodeGraph: source search, never guessed dependency relationships.
- No Jev/TypeSafe runtime: never fabricate structured model judgments or a passing audit.
- Invalid result or incomplete candidates: collect evidence or escalate.
- High-risk action: explicit authorization and deterministic constraints override model selection.
- Mandatory gate unavailable: report incomplete; never silently bypass.

A skill does not install tools or guarantee a route runs. Mandatory enforcement belongs to a supported hook, CI, or orchestration layer.
