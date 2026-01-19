### Integration Test Validation Guide (External Adapter Framework)

FOCUS ONLY ON SCOPE OF INTEGRATION TEST

## Framework Reference

**Before validating, understand the framework components:**

| Component               | Framework Source                                                                                                                                       | What to Validate              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `TestAdapter`           | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/util/testing-utils.d.ts`               | Proper usage of test harness  |
| `HttpTransport`         | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/http.d.ts`                  | Transport patterns used       |
| `SubscriptionTransport` | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/abstract/subscription.d.ts` | Background execution handling |
| Response types          | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/util/types.d.ts`                       | Response structure validation |

**Read these framework files to understand:**

- What `TestAdapter` provides
- What transport patterns are expected
- What response formats are standard

### 1. Task

- You are reviewing **only integration tests** for a single adapter in `packages/sources/<adapter>/test/integration/**`.
- Answer one question:
  - **"Are these integration tests high quality, meaningful, effective, efficient, and complete end‑to‑end tests for this adapter?"**
- Return your verdict:
  - **If YES: Set approved=true and leave rationale EMPTY (do not explain why it passed - saves tokens)**
  - **If NO: Set approved=false and provide rationale explaining what needs to be fixed**
- Do **not** change any code (no edits to tests or sources).

---

### 2. What counts as an integration test (EAF adapters)

**Framework components to check:**

- `TestAdapter` usage: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/util/testing-utils.d.ts`
- `MockWebsocketServer` usage: Same file
- Response types: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/util/types.d.ts`

Treat a test as a _real_ integration test only if:

- **It goes through the adapter entrypoint**
  - Uses `TestAdapter` (from framework testing utils) and sends realistic adapter requests like `{ base, quote, endpoint }`.
  - Check: Does it import and use framework's `TestAdapter`?
- **It uses realistic env + provider mocks**
  - Env: only the vars the adapter actually needs (`API_KEY`, RPC URLs, WS URLs, etc.).
  - `BACKGROUND_EXECUTE_MS` is around **10s (10000ms)**, not an aggressive polling interval.
  - Providers are mocked (e.g. `nock`, `MockWebsocketServer` from framework, `SocketServerMock`), not the adapter itself.
- **It asserts on user-visible behaviour**
  - Status codes, full JSON response (often snapshots), and key business fields (`result`, `data.result`, symbols, ripcord flags, etc.).
  - Check: Does it validate `AdapterResponse` structure from framework?

Tests that just call pure helpers or internal functions without going through the adapter entrypoint are **not** integration tests; call that out.

---

### 3. What a good integration suite should cover

When you look at the whole suite, check for these **signals of quality**:

- **Happy paths for main endpoints**

  - Each major endpoint (`price`, `reserve`, `nav`, `crypto_lwba`, etc.) has at least one realistic success case.
  - If there are clearly different request shapes (e.g. different `type`, symbol class, network), there is coverage for each shape that materially changes behaviour.

- **Validation behaviour**

  - Empty body `{}` and missing required fields (`base`, `quote`, `endpoint`, etc.) → `400` with a sensible error.
  - Bad combinations (e.g. unsupported network + endpoint) are handled and tested.

- **Provider / upstream failures**

  - For important endpoints, at least one test shows behaviour when:
    - Provider returns `4xx` / `5xx`
    - Provider returns malformed / semantically bad data
  - The adapter maps those to appropriate adapter errors (e.g. `502`/`504`) with useful JSON.

- **Edge cases that matter**

  - Examples: zero balances, empty arrays, inverse pairs, stale prices, overrides/mapping behaviour.
  - These tests should clearly exercise non‑trivial branches in the adapter.

- **Transports and orchestration**

  **Framework transport types:**

  - `HttpTransport`: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/http.d.ts`
  - `SubscriptionTransport`: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/abstract/subscription.d.ts`

  **Validation criteria:**

  - REST: at least one test goes all the way through real request building and nocked HTTP.
  - WebSocket / streaming:
    - Cache is warmed with `testAdapter.request(...)` + `waitForCache(...)` (from framework `TestAdapter`).
    - `FakeTimers` / `runAllUntilTime` (from framework testing utils) are used where TTL / heartbeat logic matters.
    - There is coverage for: successful subscription, a failure/invariant‑violation path, and (where relevant) subscription deduplication.

- **Env / caching / rate limiting sanity**
  - Env usage is explicit and minimal; tests don’t depend on hidden global env.
  - For cache‑heavy/WS adapters, at least one test shows TTL/heartbeat or cache usage.
  - Rate limiting is typically disabled for tests (`adapter.rateLimiting = undefined`) but does not hide important behaviour.

If a suite obviously **skips an entire dimension** (e.g. no validation errors anywhere, or no upstream error coverage), lean toward **NO**.

---

### 4. Low‑value patterns (should be called out)

Flag these as **redundant / out‑of‑scope for integration**:

- Tests that **do not go through** the adapter entrypoint.
- Tests of **language / framework trivia** (basic `try/catch`, trivial conditionals, array methods).
- Tests that exercise only **pure utilities** (parsers, formatters, math) without the adapter.
- Tests that focus mainly on **mock wiring details** instead of final adapter output.
- Large numbers of **near‑duplicate** tests with no additional behavioural insight.

---

### 5. How to structure your answer

**If approved (YES):**

- Set `approved: true` and `rationale: ""` (empty string)
- Do NOT explain why it passed - this saves output tokens

**If rejected (NO):**

- Set `approved: false`
- Provide concise rationale with:
  - Key gaps (2-3 bullets max)
  - What needs to be fixed to pass
- Keep it short and actionable

---

### 6. How the tests are expected to run (sanity check)

Assume tests are run like this:

```bash
cd external-adapters-js && yarn install && yarn setup
cd external-adapters-js && yarn clean && yarn build
export adapter=[adapter-name]
timeout 30 yarn test $adapter/test/integration
```

- All integration tests should **pass as written** under this flow.
- Flaky tests, real‑network dependencies, or undocumented extra setup are quality issues you should mention.

---

### 7. Agent docs

- Focus on **EA code and tests only**.
- DO NOT generate extra markdown to explain/summarize/report the agent behaviour, including but not limited to:
  - Reports about how you followed these rules
  - Meta‑checklists
  - Tool‑usage logs

Your output should be a concise, human‑readable evaluation of the adapter's **integration tests**, based on the standards above and the EAF integration patterns in `ea_integration_writer`.

**When validating, verify:**

1. Proper use of framework's `TestAdapter` from testing utils
2. Correct transport pattern based on adapter's transport type (check framework source)
3. Proper mocking using framework-provided utilities (`MockWebsocketServer`, etc.)
4. Response validation matches framework's response types

**Always refer to framework source files** to understand expected patterns and usage.
