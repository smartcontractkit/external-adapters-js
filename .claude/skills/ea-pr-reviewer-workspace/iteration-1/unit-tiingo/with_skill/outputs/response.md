# ea-pr-reviewer (unit mode) — Tiingo `test/unit`

## Structured result

```json
{
  "approved": false,
  "rationale": "[packages/sources/tiingo/test/unit/transport-utils.test.ts] completeness: Current cases correctly target isolated Tiingo helpers (WebSocket subscribe payload shape and primary/secondary URL cycling), not EAF transport orchestration. However, other pure exports in packages/sources/tiingo/src/transport/utils.ts—buildBatchedRequestBody, buildBatchedRequestBodyForPrice, constructEntry—encode substantial adapter business logic (chunking, ticker formatting, error shaping, result mapping) with no unit tests. Fix: add focused unit tests for those functions with deterministic inputs/outputs."
}
```

## Answer to the user task

Under **strict unit-test scope** (per `/Users/wilsonchen/Projects/external-adapters-js/.claude/skills/ea-pr-reviewer/references/unit-tests.md`): the tests in `/Users/wilsonchen/Projects/external-adapters-js/packages/sources/tiingo/test/unit/` are **meaningful business-logic tests**, not tests of framework behavior.

- **`wsMessageContent`**: Asserts Tiingo-specific WebSocket message shape—authorization, threshold, and how base/quote are combined (slash vs concatenation) and lowercased. This is custom formatting for the provider, not EAF batching, retries, or schema validation.
- **`wsSelectUrl`**: Asserts the adapter’s documented failover rule (5 attempts on primary, 1 on secondary per cycle) using plain parameter objects—no `Transport` / `Adapter` instances. That logic lives in Tiingo code (`URL_SELECTION_CYCLE_LENGTH`, modulo on `streamHandlerInvocationsWithNoConnection`), not in the framework.

The `jest.mock` on `@chainlink/external-adapter-framework/util` `makeLogger` only isolates module load side effects; the system under test remains the exported pure functions, which matches the rubric’s “direct import; deterministic” guidance.

**Gap vs rubric:** The same `utils.ts` module contains additional **unit-eligible** logic that is **not** covered in `test/unit/`, so the folder does not meet the skill’s completeness bar (“all meaningful business logic … covered where it lives in pure/isolated code”).

## Summary (optional PR comment)

- **Verdict:** Existing unit tests are appropriately scoped (business logic, not framework orchestration); **suite incomplete** for `src/transport/utils.ts`.
- **Blocker for `approved: true`:** No unit tests for `buildBatchedRequestBody`, `buildBatchedRequestBodyForPrice`, or `constructEntry`.
- **Next step:** Add deterministic unit tests for those exports; keep transport wiring and HTTP/WebSocket lifecycle in integration tests.
