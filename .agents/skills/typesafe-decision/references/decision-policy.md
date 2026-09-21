# Decision Policy

## Scope

Use semantic models only when interpretation is necessary and answers can be bounded. Deterministic code owns exact comparisons, calculations, schema validation, authorization, and execution. The main agent owns complex planning and implementation. This document does not execute TypeSafe.

## Primitive selection

| Primitive | Use | Caution |
| --- | --- | --- |
| Choice | One option from a defined candidate set | Include a no-match/review exit if the candidates may not cover the answer; winner is not proof of correctness. |
| Noul | Probability that a stated yes/no condition is true | Yes probability is not a separate confidence value; multiple conditions may independently hold. |
| Score | Graded judgment on a defined ordered rubric | Define levels beforehand; score cannot override hard constraints. |

Use only the fields provided by the actual connected model/tool. Do not assume a universal `has_blocker` field or a uniform confidence measure.

## Construct a judgment

1. State an unambiguous question and why it requires semantics.
2. Define candidates, yes/no condition, or rubric precisely.
3. Supply sufficient relevant evidence and stable source identifiers when practical.
4. Define an uncertainty, no-match, or human-review path.
5. Validate the result's schema and evidence before acting.
6. Apply business rules and authorization separately.

## Batch where meaningful

Batch independent questions about the same state when supported and useful. Do not pre-batch questions that depend on previous results or unavailable evidence. Measure total workflow latency and cost, not one model response in isolation.

## Acceptance and escalation

No universal confidence threshold applies to every task. Validate task-specific thresholds on representative examples and consider false-acceptance costs.

- Missing evidence: retrieve evidence, do not guess.
- Ambiguous/conflicting result: investigate, use deeper reasoning or human review if appropriate.
- Failed tests or exact checks: fix the failure; model scores cannot override it.
- Missing/invalid model response: use an explicitly permitted fallback or mark mandatory review incomplete.
- High-risk operation: verify permissions and obtain necessary explicit approval regardless of probability.

Do not retry unchanged calls simply to seek a more favorable score. Record observed facts separately from model judgments and assumptions.
