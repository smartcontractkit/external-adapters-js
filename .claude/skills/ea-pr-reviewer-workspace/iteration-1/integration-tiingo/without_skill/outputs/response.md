# Tiingo integration tests — EAF quality review (baseline, no skill)

**Scope:** `packages/sources/tiingo/test/integration` only. Adapter `src` was consulted only to map registered endpoints vs. tests.

## Summary

The suite follows common External Adapter Framework patterns: `TestAdapter.startWithMockedCache`, framework testing utilities, HTTP mocking with **nock**, and WebSocket mocking with **`MockWebsocketServer`** plus **`mockWebSocketProvider`**. Happy-path coverage for **all ten** adapter endpoints is strong on REST; WebSocket coverage targets crypto, crypto LWBA, IEX, and forex. Gaps are mostly around **failure modes**, **assertion depth on WS success paths**, and **one test that couples to a concrete transport module**.

---

## TestAdapter usage

**Strengths**

- **`TestAdapter.startWithMockedCache`** is used in both files with the conventional `testAdapter: {} as TestAdapter<never>` option; WS tests additionally pass **`FakeTimers.install()`** via the `clock` option, which matches async WS + TTL scenarios.
- **Lifecycle:** `beforeAll` sets env (`API_KEY`, WS-related vars), **`afterAll`** restores env with **`setEnvVariables(oldEnv)`**, closes the mock WS servers, uninstalls the fake clock when present, and **`await testAdapter.api.close()`** — appropriate cleanup.
- **HTTP suite:** **`adapter.rateLimiting = undefined`** before starting the adapter avoids rate-limit interference during tests — a practical EAF integration detail.
- **Determinism:** **`Date.now`** is mocked in HTTP `beforeAll` so snapshot output stays stable.

**Minor notes**

- HTTP tests call **`mockResponseSuccess()`** on every case even though the nock scope is built with **`.persist()`**; redundant but harmless and keeps each test self-contained if the fixture ever stops persisting.

---

## Mocks (HTTP and WebSocket)

**Strengths**

- **`fixtures.ts`** centralizes **nock** interceptors for `https://api.tiingo.com` with realistic bodies and headers, chained to match the various Tiingo paths and query shapes used by the adapter.
- **WebSocket fixtures** simulate Tiingo-style message shapes (`messageType`, `service`, `data` arrays) and the LWBA server sends a **second message after 5s** to drive the “invariant violation” scenario with fake timers.
- **IEX WS** combines a price tick with a **delayed heartbeat**, aligning with the test that advances time and checks TTL behavior.

**Risks / improvements**

- The HTTP mock is a **single large chained scope** registering many routes at once. That keeps setup fast and matches `.persist()`, but it is harder to see **which route** a given test depends on, and unrelated route changes can break unrelated tests. Per-endpoint helpers or scoped nocks would improve locality (optional refactor).
- **`adapter-ws.test.ts`** imports **`../../src/transport/crypto-lwba`** and asserts **`lwbaTransport.transport.subscriptionSet.getAll()`**. That validates “subscribe once” but **ties the test to an internal implementation detail** rather than only public adapter behavior; a black-box alternative would be preferable if the framework exposes subscription metrics elsewhere.

---

## Coverage (vs. adapter endpoints)

From `src/index.ts`, endpoints are: **crypto, volume, top, eod, iex, forex, vwap, cryptolwba (crypto_lwba), cryptoyield, volatility (realized-vol)**.

| Area                     | Covered in integration tests                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| REST happy paths         | All endpoints (`adapter.test.ts`)                                                                        |
| WS happy paths           | crypto, `crypto_lwba`, iex, forex (`adapter-ws.test.ts`)                                                 |
| WS behavioral            | LWBA single subscription + error after tick; IEX TTL after heartbeat                                     |
| REST errors / edge cases | Not covered (no 4xx/5xx, empty body, or invalid-input integration cases)                                 |
| WS status codes          | Most WS cases assert **snapshots only**, not **`response.statusCode === 200`** (except the IEX TTL test) |

**Verdict:** **Coverage is solid for “adapter wires correctly to mocked Tiingo REST/WS.”** It does not exercise **operational failure** or **validation error** paths at the integration layer.

---

## Overall EAF quality assessment

| Dimension                         | Rating                                    | Comment                                                                                           |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| TestAdapter / framework utilities | Good                                      | Correct patterns, env restore, mocked cache, fake timers where needed                             |
| Mocks                             | Good                                      | Faithful HTTP/WS shapes; monolithic nock chain is the main maintainability tradeoff               |
| Coverage                          | Good for success paths; thin for failures | Matches typical adapter integration style; extend if policy requires error-path integration tests |

**No blocking issues** for a standard EAF integration suite. The highest-value follow-ups would be **(1)** a few targeted **HTTP error** nocks, **(2)** explicit **statusCode** expectations on WS success responses where snapshots alone are insufficient, and **(3)** reducing **direct transport imports** in WS tests if possible.
