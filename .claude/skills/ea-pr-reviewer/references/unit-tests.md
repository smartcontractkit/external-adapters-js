# Unit test validation (EAF)

**Scope only:** unit tests. **Do not modify or remove** any code files.

**Framework boundaries:** See `eaf-framework-paths.md` for transports, validation, adapter, and subscription paths. Read sources to separate **framework-provided** behavior from **custom business logic**.

## Framework vs unit-testable logic

| Area                    | Typically framework-provided (not unit-test contract) |
| ----------------------- | ----------------------------------------------------- |
| Transport orchestration | Batching, caching, retries                            |
| Input validation        | Schema, types, aliases from framework                 |
| Adapter lifecycle       | Registration, init                                    |
| Background execution    | Subscription transport orchestration                  |

**Unit-testable:** Pure transforms, custom validators/parsers, business math, formatters, auth helpers, exported parsers, custom error shaping—anything you can call **without** `Adapter` / `Transport` / `InputParameters` instances.

When validating:

1. Testing framework behavior → invalid as a unit test.
2. Requires framework instances → integration scope.
3. Isolated custom logic → valid unit test.

## Goal

Decide: **Are these high quality, meaningful, effective, efficient, and complete unit tests** for the adapter’s custom logic?

## Non-negotiables

- Only judge **unit** scope.
- **If yes:** `approved: true`, `rationale: ""` (empty).
- **If no:** `approved: false` and rationale for fixes.
- Reject tests of language trivia, “concepts,” empty mock theater, or framework orchestration.
- Tests should be isolated, independent, smallest useful unit, behavior-focused.
- **All meaningful business logic should be covered** by unit tests where it lives in pure/isolated code.
- Prefer readable, maintainable tests over coverage theater.

**Checklist:**

- [ ] Imports test pure/custom code, not framework classes as the system under test.
- [ ] Does not require instantiating framework components for the behavior under test.
- [ ] Focuses on custom business logic.
- [ ] Distinction verified against framework source when unclear.

## Unit scope (test in `unit/`)

**Custom logic examples:** Parsing/formatting, business rules, staleness checks, helpers, custom classes (rate limiters, calculators), exported response transforms, custom error detection.

**Characteristics:** Direct import; deterministic; no live network (mocks OK).

## Out of scope for unit tests

Do **not** require unit coverage for: transport batching/routing/retries, framework schema validation, registration/wiring, cross-transport lifecycle, real HTTP, anything that **requires** framework instances. Those belong in **integration** tests—when reviewing **unit** tests, **ignore** gaps there on purpose.

## Decision rule

> Can I test this by importing and calling it without `Adapter` / `Transport` / `InputParameters`?

- **Yes** → unit.
- **No** → integration.

If unsure: read the framework type’s source; if the base class provides the behavior or instance methods are required → **not** a unit test.

## Output discipline

Focus on EA tests and code. Do **not** output extra meta markdown (reports, summaries, tool logs, or procedural checklists about your own process).
