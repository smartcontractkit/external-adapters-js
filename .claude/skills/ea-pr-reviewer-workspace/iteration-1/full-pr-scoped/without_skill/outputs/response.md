# PR review: Tiingo EA (`packages/sources/tiingo`) — transport-focused change (baseline, no skill)

**Assumed PR scope:** changes under `src/` that are **transport-related**, plus `test/unit/transport-utils.test.ts`. **`test/integration/**` not modified.\*\*

This review uses the current tree under `packages/sources/tiingo` and general External Adapter / External Adapter Framework (EA/EAF) testing practice.

---

## 1. Package shape (context)

- **Adapter:** `PriceAdapter` named `TIINGO`, default endpoint `crypto`, with endpoints: crypto, volume, top, eod, iex, forex, vwap, cryptolwba, cryptoyield, realized-vol (`volatility` export).
- **Config:** REST base URL, required `API_KEY`, primary and secondary WebSocket base URLs (`WS_API_ENDPOINT`, `SECONDARY_WS_API_ENDPOINT`), plus env defaults for cache / WS subscription TTL (aligned with README known-issues pattern).
- **Implementation split:** `src/endpoint/*` wires transports and input validation; `src/transport/*` holds HTTP transports, WS transports, and **`src/transport/utils.ts`** as shared batching, response shaping, and WS helpers.

---

## 2. Transport layer — what matters for this PR

### 2.1 Shared HTTP helpers (`src/transport/utils.ts`)

- **`buildBatchedRequestBody`:** Chunks inputs (max 100 tickers per Tiingo batch), dedupes ticker strings, passes token and optional `resampleFreq` for the crypto prices path. Correct pattern for provider limits; dedupe avoids redundant provider work.
- **`buildBatchedRequestBodyForPrice`:** One request per param with `consolidateBaseCurrency` and fixed `resampleFreq: '24hour'` — appropriate when the API expects per-pair price queries.
- **`constructEntry`:** Maps provider array to per-request results; empty body yields **502** with a clear message per param; VWAP path strips a `cvwap` suffix from `baseCurrency` before matching params. Any PR touching this must preserve **ordering / pairing** semantics between `res.data` and `params` (typical footgun in batched parsers).
- **WS helpers:** `wsMessageContent` (optional `skipSlash` for forex-style tickers), `wsSelectUrl` (6-step cycle: 5 primary attempts then 1 secondary — documented in comments), thin subclasses `TiingoWebsocketTransport` / `TiingoWebsocketReverseMappingTransport` exposing `apiKey` for subscribe builders.

### 2.2 How transports are consumed

Example: `src/transport/crypto-http.ts` uses `HttpTransport` with `prepareRequests` → `buildBatchedRequestBodyForPrice` and `parseResponse` → `constructEntry(..., 'close')`. Other endpoints compose the same utils with different URLs or `resultPath` (`close`, `volumeNotional`, `fxClose`, etc.). Transport changes ripple across **all** endpoints that import these helpers.

---

## 3. Unit tests — `test/unit/transport-utils.test.ts`

**Coverage today (targeted):**

- **`wsMessageContent`:** Default slash-separated lowercased ticker vs `skipSlash` concatenation — matches how forex WS uses `skipSlash = true` in transport code.
- **`wsSelectUrl`:** Asserts primary URL for `streamHandlerInvocationsWithNoConnection: 1` and secondary for `6`, consistent with `URL_SELECTION_CYCLE_LENGTH = 6` and the “5 primary, 1 secondary” comment (1-based invocation counter).

**Gaps relative to `utils.ts` (if the PR only extends these tests):**

- No direct tests for **`buildBatchedRequestBody` / `buildBatchedRequestBodyForPrice`** (chunking at 100, dedupe, `resampleFreq` branch).
- No tests for **`constructEntry`** (empty response → 502 mapping, `cvwap` stripping, `resultPath` branches).
- Subclasses (`TiingoWebsocketTransport`, `TiingoWebsocketReverseMappingTransport`) are behaviorally thin; testing is optional unless the PR adds logic there.

**Verdict:** The unit file is a **good fit for PRs that touch `wsMessageContent` / `wsSelectUrl`**. If the PR changes HTTP batching or `constructEntry`, reviewers should expect **additional unit tests** or a strong justification that integration snapshots are sufficient.

---

## 4. Integration tests — `test/integration/*` (unchanged in PR)

### 4.1 `adapter.test.ts` + `fixtures.ts` (HTTP)

- Uses EAF **`TestAdapter.startWithMockedCache`**, disables `adapter.rateLimiting` for determinism, **`nock`** against `https://api.tiingo.com` with `.persist()` and routes matching each endpoint’s REST paths/queries.
- Assertions are mostly **snapshot-based** — good for regression detection, weaker for specifying exact numeric or edge behavior unless snapshots are reviewed.
- Covers: cryptoyield, crypto (REST), eod, top, volume, vwap, forex (REST), iex (REST), realized-vol.

**Risk if transport code changes but integration tests are not updated:**

- Snapshots may still pass if mocks are loose or responses unchanged; **breaking changes to request shape** (URL, query params, headers) may **fail nock matching** and surface as test failures — that is the main safety net here.
- **Gaps:** Not every transport path may have a dedicated scenario (e.g. batching with >1 ticker in one HTTP call); crypto-lwba REST is not in this file (WS covered elsewhere).

### 4.2 `adapter-ws.test.ts` (WebSocket)

- Mocks **`WebSocketClassProvider`**, stands up **`MockWebsocketServer`** on paths: `/crypto-synth`, `/crypto-synth-top`, `/iex`, `/fx`.
- Uses **fake timers** and `waitForCache` to synchronize with background execution; crypto_lwba tests include **subscription deduplication** (case-insensitive) and **invariant violation** after a timed second message.
- iex test validates **TTL extension** after heartbeat using `runAllUntilTime`.

**Risk if `wsSelectUrl` / URL construction / message format changes:**

- Integration tests **do exercise** real WS transport wiring and snapshots for crypto, crypto_lwba, forex, iex. They do **not** explicitly assert the **primary vs secondary URL failover cycle** (that logic is only covered at unit level in `transport-utils.test.ts`). A regression purely in failover sequencing might be missed if not covered by new tests.

---

## 5. PR review checklist (scoped to stated diff)

| Area                   | Question                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP batching**      | Do chunk size, dedupe, and query params still match Tiingo’s API contract?                                                                                                 |
| **`constructEntry`**   | Are empty vs partial responses handled without mis-associating rows to request params?                                                                                     |
| **WS URL selection**   | Does the 6-step cycle still match operational intent; is `streamHandlerInvocationsWithNoConnection` still 1-based as assumed?                                              |
| **`wsMessageContent`** | Do all callers pass `skipSlash` correctly for forex vs crypto-style tickers?                                                                                               |
| **Unit tests**         | Do new branches in `utils.ts` have assertions; are magic numbers (6, 100) documented or tested?                                                                            |
| **Integration**        | If integration tests are untouched, run them locally; confirm nock/query still matches new requests. Consider updating snapshots only when behavior intentionally changes. |

---

## 6. Overall assessment

- The Tiingo package is a **typical EAF v2 layout**: endpoints delegate to **`HttpTransport` / WebSocket transports**, shared **`transport/utils.ts`**, and **integration tests** that combine `TestAdapter`, **nock**, and **mock WebSocket servers**.
- For a **transport-only PR** with updates to **`transport-utils.test.ts`**, the testing story is **coherent** for WS helper behavior, but **HTTP-heavy changes** should not rely solely on unchanged integration snapshots.
- **Recommendation:** Approve if unit tests cover all new/changed public behavior in `utils.ts`, CI passes **unit + integration** for `tiingo`, and any snapshot updates are reviewed for intentional contract changes. If the PR alters failover URL selection, consider a **small integration or unit test** that exercises more than one cycle index.

---

## 7. Files referenced (for traceability)

- `packages/sources/tiingo/src/index.ts` — adapter assembly and rate limits
- `packages/sources/tiingo/src/config/index.ts` — env settings
- `packages/sources/tiingo/src/transport/utils.ts` — shared transport logic
- `packages/sources/tiingo/src/transport/crypto-http.ts` — example HTTP transport wiring
- `packages/sources/tiingo/test/unit/transport-utils.test.ts` — WS helper unit tests
- `packages/sources/tiingo/test/integration/adapter.test.ts`, `adapter-ws.test.ts`, `fixtures.ts` — integration coverage

---

_Baseline review completed without reading `.claude/skills/ea-pr-reviewer`._
