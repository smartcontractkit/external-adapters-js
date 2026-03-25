# EA PR reviewer output (full mode) — `packages/sources/tiingo`

**Scope note:** User stated the PR changed `src/` (transport-related) and `test/unit/transport-utils.test.ts` only; `test/integration/**` was not modified. Per `ea-pr-reviewer/SKILL.md` scoping, **`integration_tests` is approved with an empty `rationale`** (full integration rubric is not used to fail that dimension for pre-existing suite gaps). This review still reads the whole adapter areas requested (`src/`, unit tests, integration tests) for context.

## Structured result

```json
{
  "code_review": {
    "approved": false,
    "rationale": "[/Users/wilsonchen/Projects/external-adapters-js/packages/sources/tiingo/src/transport/crypto-ws.ts:42] Correctness: On non-`A` messages, code reads `message.response.message === 'authorization failed'` without optional chaining. Malformed messages that omit `response` can throw before `return []`. Fix: `message.response?.message === 'authorization failed'`.\n[/Users/wilsonchen/Projects/external-adapters-js/packages/sources/tiingo/src/transport/utils.ts:109-122] Correctness: `constructEntry` uses `entry.priceData[0]` without checking `priceData` is non-empty. Empty `priceData` can throw at runtime. Fix: guard empty `priceData` and return an adapter-shaped error (similar to the empty `res` branch) or explicit handling."
  },
  "integration_tests": {
    "approved": true,
    "rationale": ""
  },
  "unit_tests": {
    "approved": false,
    "rationale": "[/Users/wilsonchen/Projects/external-adapters-js/packages/sources/tiingo/test/unit/transport-utils.test.ts] scope: correctly unit-tests pure helpers `wsMessageContent` and `wsSelectUrl` without framework instances. Gap: other isolated exports in [/Users/wilsonchen/Projects/external-adapters-js/packages/sources/tiingo/src/transport/utils.ts] (`buildBatchedRequestBody`, `buildBatchedRequestBodyForPrice`, `constructEntry`) have no unit coverage; batching/chunking, ticker params, empty/misaligned provider rows, and `cvwap` stripping are untested at unit scope. Fix: add focused unit cases for those functions or document intentional integration-only verification."
  },
  "overall_approved": false
}
```

## Summary

- **Code:** Block **crypto-ws** on unsafe `message.response` access when handling non-`A` messages; harden **constructEntry** when `priceData` is empty.
- **Unit:** Extend unit tests to `constructEntry` and the HTTP batch request builders in `utils.ts`, or accept integration-only coverage for that logic (current unit file is not complete for `utils.ts`).
- **Integration (out of PR scope):** No integration test changes were in scope, so the integration dimension is not failed on rubric gaps; separately, the existing HTTP integration suite is still light on bad-input validation and nocked upstream error paths if you want to chip away at long-term debt.
