# EA PR reviewer — integration mode (Tiingo)

**Scope:** `/Users/wilsonchen/Projects/external-adapters-js/packages/sources/tiingo/test/integration/**` only. Production source read only as needed for test intent (not reviewed for quality).

## Structured result

```json
{
  "approved": false,
  "rationale": "- No integration coverage for input validation: missing required fields, empty body, or invalid combinations should yield 4xx with stable error payloads.\n- No integration coverage for upstream failures: Tiingo REST/WS 4xx/5xx or malformed payloads and how the adapter maps them to status/JSON.\n- `adapter-ws.test.ts` asserts `lwbaTransport.transport.subscriptionSet` (internal transport state); prefer observable adapter responses or documented framework hooks over importing `../../src/transport/crypto-lwba`."
}
```

## Summary

- **Verdict:** Not approved for EAF integration-test quality as defined in `ea-pr-reviewer` / `references/integration-tests.md`.
- **Strengths:** REST suite uses `TestAdapter.startWithMockedCache`, `nock` against `https://api.tiingo.com`, minimal `API_KEY`, rate limiting cleared, and snapshots on `response.json()` for many endpoints. WS suite uses `MockWebsocketServer`, `mockWebSocketProvider`, `FakeTimers`, `waitForCache`, `runAllUntilTime`, plus LWBA dedup and an invariant-violation path—closer to the rubric’s transport expectations.
- **Blockers:** Entire dimensions called out in the rubric (validation errors; upstream failure handling) are absent. One WS test couples to implementation details via a direct transport import.
