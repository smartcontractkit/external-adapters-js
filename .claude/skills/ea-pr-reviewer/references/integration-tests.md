# Integration test validation (EAF)

**Scope only:** integration tests. **Do not edit** test or source files.

**Framework paths:** See `eaf-framework-paths.md` for `TestAdapter`, `MockWebsocketServer`, `HttpTransport`, `SubscriptionTransport`, and response types.

Read framework sources to understand what the harness provides, expected transport patterns, and standard response shapes.

## Task

- Review **only** integration tests for an adapter under `packages/sources/<adapter>/test/integration/**`.
- Question: **Are these integration tests high quality, meaningful, effective, efficient, and complete end-to-end tests for this adapter?**
- **If yes:** `approved: true`, `rationale: ""` (empty — do not explain pass).
- **If no:** `approved: false` and concise rationale (what to fix).

## What counts as an integration test

A real integration test:

1. **Goes through the adapter entrypoint** — uses framework `TestAdapter` with realistic requests (e.g. `{ base, quote, endpoint }`).
2. **Realistic env + provider mocks** — only needed env vars; `BACKGROUND_EXECUTE_MS` around **10s (10000ms)** for background cases; upstream mocked with `nock`, `MockWebsocketServer`, `SocketServerMock`, etc., not the adapter under test.
3. **Asserts user-visible behavior** — status codes, JSON (often snapshots), key fields (`result`, `data.result`, symbols, ripcord, etc.); validates `AdapterResponse`-shaped results.

Tests that only hit pure helpers or internals without the adapter entrypoint are **not** integration tests—call that out.

## Quality signals for the suite

- **Happy paths:** Major endpoints covered; distinct request shapes that change behavior each have coverage where it matters.
- **Validation:** `{}` / missing required fields → `400` with sensible errors; bad combinations tested where relevant.
- **Upstream failures:** Important paths cover 4xx/5xx and malformed data; adapter maps to appropriate errors (e.g. 502/504) with useful JSON.
- **Edge cases:** Non-trivial branches (zeros, empty arrays, inverse pairs, staleness, mappings).
- **Transports:** REST exercises real request build + nocked HTTP. WS/streaming: cache warmup (`testAdapter.request`, `waitForCache`), `FakeTimers` / `runAllUntilTime` when TTL/heartbeat matters; success, failure/invariant paths, deduplication where relevant.
- **Env / cache / rate limits:** Explicit minimal env; cache/TTL tests for heavy adapters; rate limiting often disabled in tests without hiding real behavior.

If an entire dimension is missing (e.g. no validation errors anywhere), lean **no**.

## Low-value patterns

Flag as redundant for integration:

- No adapter entrypoint.
- Language/framework trivia.
- Only pure utilities without the adapter.
- Mock-wiring focus instead of final adapter output.
- Many near-duplicates with no new behavioral insight.

## Answer shape

- **Approved:** `approved: true`, `rationale: ""`.
- **Rejected:** `approved: false`, short actionable bullets (2–3 gaps max).

## How tests should run (sanity)

```bash
cd external-adapters-js && yarn install && yarn setup
cd external-adapters-js && yarn clean && yarn build
export adapter=[adapter-name]
timeout 30 yarn test $adapter/test/integration
```

Flaky tests, real network, or undocumented setup are quality issues.

## Output discipline

Focus on EA code and tests. Do **not** add meta-reports, “how I followed these rules,” tool logs, or extra checklists in the reply.

When validating: confirm `TestAdapter` usage, transport pattern matches adapter type (from framework source), mocking uses framework utilities where appropriate, and assertions match framework response types.
