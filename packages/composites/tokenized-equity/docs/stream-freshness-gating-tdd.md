- [Product Proposal](https://docs.google.com/document/d/183y0Hy_dp6XTAv7LpOAOb0mAxgCVEqhFamLD5EHvOek/edit?tab=t.0)
- [TDD / Planning Doc](https://docs.google.com/document/d/1ziBiHnXtXYcO_FmmH8k0n9hvT_imXa7MiuDksRu4-hM/edit?tab=t.0)
- [Tokenized Equity EA Implementation Proposal](https://docs.google.com/document/d/1UHgJP7NwhwrQpI002AbK51dvvWOQ3bAOGtvLNJYBgiU/edit?tab=t.0)
- [tradinghours EA](https://github.com/smartcontractkit/external-adapters-js/tree/main/packages/sources/tradinghours)

The tokenized equity EA (packages/composites/tokenized-equity) must accommodate two aspects of the reports being produced by the upstream DataEngine

- Previous session / stale. If a price arrives that is older than a configured "freshness" value, it should be discarded.
- Pre-open warm-up before session start. If a price arrives with a lastSeenTimestampNs that is before the current session start it must be discarded.

Pre-Planning and Information Gathering:

- DONE: get the tokenized-equity EA running locally - can we run this locally pointing it to the tradinghours in staging? -> yes.
- SKIPPED: get the tradinghours EA running locally --> not necessary, we can hit the EA in staging
- DONE: poke at the two tradinghours endpoints to ensure they return what we need to implement the "warm up" check
- DONE (design): freshness/staleness timeout design → see "Staleness / freshness design" below.
- DONE: Propose a design for caching the tradinghours market-session data
  the tradinghours does some of it's own caching it should be fine to hit this w/no caching.
- DONE (design): `overnightStreamMaxAgeInSeconds` interaction with the new check → see "Interaction with overnightStreamMaxAgeInSeconds" below.
- DONE (design): marketStatus=0 (UNKNOWN) handling → see "UNKNOWN marketStatus" below.

Implementation and Rollout Planning:

- DONE (plan): monitoring and alerting → see "Monitoring & alerting plan" below.
- DONE (plan): test mapping for PR1 → see "PR1 test plan" below.
- DONE (plan): config changes per adapter/env, rollout plan, verification steps → see
  "Rollout & verification plan" below.

Implementation

- PR1 (first checkpoint/commit) implement tests, ensure the current EA fails
- PR1 (second checkpoint/commit) implement new behavior

Considerations

- we want to avoid adding any new parameters into the tokenized-equity EA

Two examples of hitting data-engine:

```bash
curl -sS -X POST https://adapters.main.stage.cldev.sh/data-engine \
    -H 'content-type: application/json' \
    -d
'{"data":{"endpoint":"deutscheBoerse-v11","feedId":"0x000bbd87a23775b4c11092ae9a1fc7b3393636ae1dbb9f1ef460f845c0f4cff1"}}'
```

```bash
  curl -sS -X POST https://adapters.main.stage.cldev.sh/tradinghours-mercury \
    -H 'content-type: application/json' \
    -d '{
      "data": {
        "endpoint": "market-session",
        "market": "nyse",
        "type": "24/5",
        "timezone": "America/New_York"
      }
    }'
```

Useful one-liners:

```bash
# pretty-print market-session transition schedule:
jq -c '.data.result | map([.status, .statusString, .time])[]'

# quick conversion of a lastSeenTimestampNs to local time:
perl -e 'print(scalar(localtime($ARGV[0]/10**9)),"\n")' 1793311926290000000

# ...or rendered in America/New_York:
TZ=America/New_York perl -e 'print(scalar(localtime($ARGV[0]/10**9)),"\n")' 1793311926290000000
```

NB: mercury is the legacy name for DataStreams.

## Findings (verified against staging 2026-10)

### Live staging endpoints (all behind the shared nginx gateway `https://adapters.main.stage.cldev.sh/<release-name>`)

- `POST /data-engine` — `{"data":{"endpoint":"deutscheBoerse-v11","feedId":"0x000bbd87...4cff1"}}` returns
  `mid/bid/ask/bidVolume/askVolume/lastTradedPrice/marketStatus/decimals(18)/lastSeenTimestampNs`.
  That feedId is the **AAPL/USD regular-hours ("open") stream** (registry: `reference-data-directory/data-streams/streams/1000009175.json`;
  siblings: extended `0x000b8b93...910b5b`, overnight `0x000b313c...0553c0b`, closed `0x000355d7...1368bc`). ~$350.45 at time of check.
- `POST /tradinghours-mercury`
  - `market-session` (params: market, type=24/5, timezone) → session transition schedule (OVERNIGHT/PRE_MARKET/REGULAR/POST_MARKET timestamps).
  - `market-status` (params: market only; `type:"24/5"` is rejected) → current status, e.g. `{"result":1,"statusString":"CLOSED"}`.
- `POST /tokenized-equity` — endpoints: `price` (default), `coinbase`, `ondo`, `robinhood`, `xstocks`.
  Validation quirks: kalman smoother requires `sessionBoundariesTimeZone`; `smoother:"none"` forbids all session\* params.
  Observed behaviors: 504 while warming up; then 503 `"Market is not open: regular POST_MARKET, ..."` when gated.

### Architecture / infra

- data-engine endpoints are defined in this repo: `packages/sources/data-engine/src/endpoint/` → `blended`, `crypto-v3`, `deutscheBoerse-v11`, `exchangeRate-v7`, `rwa-v8`, `twap`.
- EAs deploy to the **main** cluster, not o11y: Argo UIs are `https://argo.main.stage.cldev.sh` / `https://argo.main.prod.cldev.sh`;
  app names = `adapter-<release>` from `infra-k8s/projects/adapters/apps/` (e.g. `adapter-tokenized-equity`, `adapter-tradinghours-mercury`).
- Stage wiring (`infra-k8s/projects/adapters/files/adapters/data-feeds/tokenized-equity/config.yaml`):
  `DATA_ENGINE_ADAPTER_URL=https://adapters.main.stage.cldev.sh/data-engine`,
  `TRADING_HOURS_ADAPTER_URL=https://adapters.main.stage.cldev.sh/tradinghours-mercury`.
- Direct per-adapter ALB (`adapter-<name>.<cluster domain>`) requires chainlink-adapter chart ≥0.10.0; tokenized-equity pins 0.8.0 → not available, use the shared gateway.

### Market-status determination (design conclusion)

- tokenized-equity **never calls tradinghours `market-status`** — only `market-session` (single call site: `src/lib/session/tradingHoursSession.ts`).
- Gating ("is the market open / which stream") uses the **`marketStatus` field inside each data-engine report** (`src/lib/streams.ts`) — provider-authoritative, per-stream.
- The tradinghours `market-session` schedule (fallback: local `sessionBoundaries`+timezone via `TZDate`, `src/lib/session/fallbackSession.ts`) is only used for **timing** (seconds-from-transition for the smoother/warm-up).
- Pure local time is the fallback, not a replacement: holidays/half-days/weekends need a real calendar.
- ⇒ For DF-28181: use report `marketStatus` for pass-through/reject decisions; use `market-session` (with local fallback) for warm-up/staleness timing. `market-status` endpoint is redundant for this EA (optional health probe only).

### V11 report `marketStatus` semantics (observed vs staging)

- The V11 SDK type is a bare `number`; tokenized-equity interprets it via the framework's
  `TwentyfourFiveMarketStatus` enum: 0=UNKNOWN, 1=PRE_MARKET, 2=REGULAR, 3=POST_MARKET, 4=OVERNIGHT, 5=WEEKEND.
- It is provider-set (Deutsche Börse DON) and reflects **the market's current session phase, echoed on
  every stream** — not "is this stream open". Observed: during REGULAR session all three AAPL streams
  report `2`; Thu 20:03 ET regular reported `3`. This is why `getStream()`'s per-session matching works:
  exactly one branch matches at any time.
- Freshness is independent of the echoed status: during REGULAR, regular+extended streams update ~1/s
  while the overnight stream's `lastSeenTimestampNs` stays frozen at its session end (04:00 ET) yet
  still reports `marketStatus=2`.
- Unverified (cadence poller will confirm): transition sequence at 16:00 ET (expect 2→3) and at
  Friday 20:00 ET (expect 3→5, no overnight session on Fridays); whether WEEKEND(5) appears only in
  the Fri 20:00 → Sun 20:00 ET window.
  - 16:00 ET transition CONFIRMED (2026-10-30): all three streams flipped 2→3 at the close.
    Notably the regular stream's `lastSeenTimestampNs` was still only ~2 min old 75 min into
    POST_MARKET — a pure age check would NOT have rejected it after close. Evidence that the two
    checks are complementary: `marketStatus` gates wrong-session streams, staleness gates
    mid-session freezes.
- The registry's fourth feedId (`closed`, e.g. `0x000355d7...68bc` for AAPL) is **not** served by
  `deutscheBoerse-v11` (504 "no values yet"); in the DON config it's wired to the **`blended`**
  endpoint — it's the fallback price source used when the market is closed, not another
  marketStatus value on the session streams.

## Staleness / freshness design (analysis, pre-implementation)

### Current state (verified in code)

- Every V11 report carries `lastSeenTimestampNs` (provider-side timestamp, `deutscheBoerseV11.ts`), so the
  tokenized-equity EA can always compute report age against its own clock: `age = now() - lastSeenTimestampNs/1e9`.
- Today the only staleness control is the per-request param `overnightStreamMaxAgeInSeconds`
  (`endpoint/common.ts`), forwarded to data-engine (`lib/streams.ts` → `getDeutscheBoersePrice` →
  `maxAgeInSeconds`). **regular and extended streams have no staleness check at all.**
- How data-engine applies `maxAgeInSeconds` (`data-engine/src/transport/wsTransportBase.ts:114-124`):
  a stale WS report is _dropped_ — it produces **no** result, so the EA's cache keeps serving the
  **last accepted report indefinitely**. The REST consumer receives an old report with an old
  `lastSeenTimestampNs` and **no error signal**. (Only if _no_ report was ever accepted does the
  consumer see the 504 warm-up timeout.)
- ⇒ Consequence: data-engine-side filtering alone converts "stale data" into "silently stale data".
  It cannot be the enforcement point; it is at best a defense-in-depth layer.

### Decision 1: enforce consumer-side, in tokenized-equity

- Enforcement point: `lib/streams.ts` `getStream()` — a stream whose report age exceeds its
  threshold is **ineligible for selection**, exactly like a stream with the wrong `marketStatus`.
  If no stream is eligible → 503 `AdapterError` whose message includes each stream's status _and_
  age/threshold (extends the existing "Market is not open: regular POST_MARKET, ..." message, e.g.
  `regular STALE(age=42s>30s)`).
- Why not fail-over to a fresher stream of a _different_ session type when the selected one is
  stale: that would silently switch the pricing source (e.g. publish overnight-EMA while the
  regular feed claims REGULAR). Rejecting is safer and louder; staleness of the active session's
  stream is exactly the condition we want visible.
- Check runs before the smoother update in `smoothedPrice.ts` (it already does, since `getPrice`
  throws), so stale ticks never poison kalman/EMA state.
- Clock skew: `lastSeenTimestampNs` is provider-side; thresholds must be ≫ poll cadence
  (`BACKGROUND_EXECUTE_MS`, default 1s) and ≫ expected NTP skew (seconds). This is an age check,
  not a precise deadline, so skew is not a correctness concern at these magnitudes.

### Decision 2: configuration model — instance-level env, per-session thresholds

Constraint from this doc: **no new request parameters** on the tokenized-equity EA. Also, the
existing per-request `overnightStreamMaxAgeInSeconds` is operationally awkward: the value lives in
the DON feed config (per asset) yet the thing that changes at ops time is the tolerance, not the
asset mapping.

- Thresholds naturally differ **per session type**, not per asset: regular/extended streams tick
  ~1/s during their session, the overnight stream is intentionally sparse. A single global value
  would either false-positive on overnight or be too lax for regular.
- Proposal (env vars on the tokenized-equity EA instance) — **DECIDED**:
  - `DS_VALID_MAX_AGE_SECONDS` — shared default (unset/0 = consumer-side check disabled, preserving
    current behavior for a safe rollout; enable per-environment deliberately).
  - `DS_VALID_MAX_AGE_SECONDS_REGULAR`, `DS_VALID_MAX_AGE_SECONDS_EXTENDED`,
    `DS_VALID_MAX_AGE_SECONDS_OVERNIGHT` — optional per-session overrides falling back to the
    shared default. (Family-first ordering: the common `DS_VALID_MAX_AGE_SECONDS` prefix keeps the
    whole family adjacent in sorted env listings and searchable by prefix; "valid max age" echoes
    the Data Streams report's own validity fields.)
- Per-asset-type vs per-instance: **per-instance (with per-session granularity) is sufficient.**
  All tokenized equities on an instance share the same upstream cadence characteristics; a per-asset
  knob would have to live in the DON feed config (a request param), which violates the constraint
  and multiplies rollout surface. Escape hatch if a genuine per-asset need appears later: keep
  `overnightStreamMaxAgeInSeconds` as a per-request override (it already exists); extend that
  pattern rather than adding config up front.
- Interaction with the existing param (**DECIDED**): keep forwarding `overnightStreamMaxAgeInSeconds`
  to data-engine unchanged (defense in depth); the consumer-side check is authoritative. Document the
  relationship; no deprecation, no new per-request overrides.

### Decision 3: session-start behavior (**DECIDED**)

At a session boundary the newly-active stream's `lastSeenTimestampNs` can be hours/days old until the
first fresh report arrives (e.g. overnight stream at Sunday 20:00 ET: last report is Friday 04:00 ET).
The age check applies anyway → 503 until the first fresh report arrives. Rationale: it genuinely means
"no fresh data yet", self-heals on the first report of the new session, and matches today's 504
warm-up behavior. No grace window — that would couple staleness to the session/warm-up machinery,
which this design deliberately keeps separate.

### Rejected alternatives

- _Data-engine-side only (status quo extended):_ silent staleness, no error semantics — see above.
- _Single global threshold:_ false positives on the sparse overnight stream or too lax for regular.
- _Per-request staleness params:_ violates the "no new parameters" constraint; ops values don't
  belong in per-asset DON feed configs.
- _Fail-over across session types on staleness:_ silently changes the pricing source; reject (503)
  instead.
- _Post-transition grace window for staleness:_ couples the freshness check to the session/warm-up
  machinery; transient 503s at session start are preferred (self-healing, matches 504 warm-up
  semantics).

### Interaction with `overnightStreamMaxAgeInSeconds` (**DECIDED**)

Requirement: when the price is "too stale", nothing is published — tokenized-equity returns 503.

- The existing request param **cannot deliver this by itself**: data-engine drops stale WS reports
  but keeps serving the last accepted report from cache — the consumer sees an old report with no
  error and would publish it. The 503 semantics come only from the new consumer-side check.
- If both are set, the request param can only make the cached report _older_ (fresh-enough updates
  get dropped upstream), never newer — so the consumer check always dominates the outcome.
  Effective behavior ≈ min(param, env threshold), with all error semantics from the consumer side.
- Param set + env unset → today's silent-staleness behavior remains.
- Steady state: leave `overnightStreamMaxAgeInSeconds` **unset** in DON feed configs and let the
  EA's `DS_VALID_MAX_AGE_SECONDS*` env thresholds own staleness; keep the param only as an
  emergency per-asset escape hatch. (Also note: the param lives in per-asset DON feed configs =
  slow rollout surface; the env var is a single EA-level change.)

### UNKNOWN marketStatus (0) (**DECIDED**)

- Requirement (no price when the provider status is unknown/unavailable) is **already met by the
  current code**: UNKNOWN matches no branch in `getStream()`, so it falls through to the 503
  "Market is not open: regular UNKNOWN, ..." path. Same for WEEKEND (5).
- Gap is tests + observability, not behavior: add an explicit unit/integration test pinning the
  UNKNOWN → 503 behavior (PR1), and make monitoring able to distinguish "provider degraded"
  (UNKNOWN) from "market legitimately closed" (POST_MARKET/WEEKEND) — same HTTP code, very
  different ops response. Candidate: rejection-reason label/counter (see monitoring item below).
- Mixed statuses across streams are possible near transitions (e.g. regular=UNKNOWN while
  extended=POST_MARKET): current code selects the extended stream. That is reasonable — the check
  gates on the status of the stream actually selected.

### Open questions for implementation

- Default values per session when `DS_VALID_MAX_AGE_SECONDS` is set (start: regular/extended 30s,
  overnight — align with overnight feed's expected cadence; being validated against staging
  traffic).
- Metric naming/labels above are proposals — confirm against the team's Prometheus conventions at
  implementation time.

## Monitoring & alerting plan

### What the framework already gives (no code changes)

- `httpRequestsTotal{type="adapterError", status_code=503, feed_id}` — every rejection, but the
  **reason is not distinguishable** (market closed vs stale vs UNKNOWN are all 503s).
- `bgExecuteErrors{transport, adapter_endpoint}` — increments every background tick (~1s) while
  gated, so a closed market already produces a noisy error baseline today. Not actionable as-is.
- `cacheDataStalenessSeconds` / `totalDataStalenessSeconds{feed_id}` — cache-age gauges.
- `providerTimeDelta{feed_id}` — provider-vs-local clock delta; the sanity check that our
  consumer-side age math (`now - lastSeenTimestampNs`) can be trusted.
- `dataProviderRequests{provider_status_code}` — health of outbound calls to data-engine /
  tradinghours.

### New metrics to add in tokenized-equity (minimal, single choke point)

All recorded in `lib/streams.ts getStream()` / `getPrice()` — the one place all three streams are
seen every tick:

1. `tokenized_equity_rejection_total{endpoint, asset, reason}` counter,
   reason ∈ {`market_closed`, `stale`, `unknown`} (+ the smoother/session failure modes if cheap).
   This is the fix for the 503-reason blindness above, and directly answers the "counters for
   pass-through vs reject" ask. For pass-throughs, the existing 200s in `httpRequestsTotal` suffice
   (reject counter + 200 counter = full picture).
2. `tokenized_equity_stream_report_age_seconds{asset, stream}` gauge (stream ∈
   regular/extended/overnight) — last observed report age per stream per tick. This is the
   primary tuning + alerting signal: it shows freshness _before_ anything rejects, and its
   distribution during each session is what the per-session default thresholds should be set from.
3. `tokenized_equity_stream_market_status{asset, stream}` gauge — last seen enum value per stream.
   Answers "what does the provider say right now" and lets alerts be session-aware.

Cardinality is bounded: assets come from DON feed configs (dozens), streams are 3, reasons ~5,
statuses 6 — all fine.

### Logging

- The 503 `AdapterError` message already lists every stream's status; extend it to include each
  stream's age vs its threshold (e.g. `regular STALE(age=42s>30s)`) so Loki/grep alone can
  reconstruct an incident without Prometheus.
- data-engine already logs `Filtering out stale report: feedId=... age=...s` on its side — same
  story from the producer's view.

### Alerts (session-aware; staging first, then prod)

- **Page:** `tokenized_equity_stream_report_age_seconds` > session threshold for > 5 min **while**
  `tokenized_equity_stream_market_status` says that stream's session is active → upstream stream
  frozen mid-session (the failure this feature exists to catch).
- **Page:** `tokenized_equity_stream_market_status == 0` (UNKNOWN) for > 10 min → provider
  degraded. Distinct from market-closed (expected), which never pages.
- **Warn:** rate of `tokenized_equity_rejection_total{reason="stale"}` above the closed-market
  baseline, or any rejection with `reason="unknown"`.
- **Never alert on:** `reason="market_closed"` rejections outside sessions — that's the feature
  working as intended. (This is why reason labels matter; today's unlabeled 503s can't express this.)
- **Meta:** `providerTimeDelta` beyond a few seconds → clock skew would corrupt the age check;
  alert on the node/NTP, not the EA.

### Rollout / tuning loop

1. Ship metrics + code with `DS_VALID_MAX_AGE_SECONDS` unset (check disabled) → metrics show
   per-session age distributions with zero behavior change.
2. Set loose thresholds in staging; watch `tokenized_equity_stream_report_age_seconds` percentiles
   per session (and observed staging cadence data) to pick final defaults.
3. Tighten to defaults; promote staging → prod testnet → prod, watching the reject-reason counters
   at each step (expect `market_closed` only).
4. Dashboard: per-asset panel = market_status timeline + per-stream report ages + reject counter
   by reason + pass-through rate.

## PR1 test plan

Scope: the staleness/freshness check + UNKNOWN marketStatus handling (both land in
`lib/streams.ts`; the pre-open warm-up check is a separate work item). Conventions follow the
existing suite: unit tests mock `getDeutscheBoersePrice` per stream
(`test/unit/lib/streams.test.ts`); integration tests use `TestAdapter` + nock fixtures with a
mocked `Date.now()` (`test/integration/adapter-price.test.ts`) — the mocked clock is exactly what
staleness tests need. Fixtures must compute `lastSeenTimestampNs` relative to the mocked clock
(current `fixtures.ts` uses fixed timestamps → update).

### Unit: `lib/streams.ts` (getStream selection + age eligibility)

New behavior — **must FAIL on current code** (PR1 checkpoint 1):

1. Active stream stale → 503: regular REGULAR with age > `DS_VALID_MAX_AGE_SECONDS_REGULAR` →
   AdapterError 503; message includes per-stream status AND age-vs-threshold (e.g.
   `regular STALE(age=42s>30s)`).
2. Same for extended POST_MARKET stale and overnight OVERNIGHT stale (per-session thresholds).
3. No fail-over: regular REGULAR+stale while extended POST_MARKET+fresh → 503, not extended
   (pins Decision 1: never silently switch session type on staleness).
4. Boundary: age == threshold → allowed; age > threshold → rejected (define `>` semantics).
5. Check disabled (env unset) → stale report passes through (rollout flag behavior).
6. Config resolution: per-session override beats `DS_VALID_MAX_AGE_SECONDS`; shared default used
   when no override; unset = disabled.
7. Mixed: one stream fresh+right status, others stale → fresh stream selected (staleness only
   disqualifies the stale stream, doesn't poison selection).

Existing behavior pinned — **must PASS on current code** (regression guard):

8. All streams UNKNOWN(0) → 503 "Market is not open" (UNKNOWN handling requirement, already met).
9. WEEKEND(5) → 503 (same path).
10. Mixed statuses: regular UNKNOWN + extended POST_MARKET fresh → extended selected.

### Unit: `transport/smoothedPrice.ts`

11. Stale active stream → `getPrice` throws before any smoother state update (spy: `processUpdate`
    / `processOvernightUpdate` never called) — stale ticks must not poison kalman/EMA state.

### Unit: `config/index.ts`

12. New env vars parse as numbers; negative/NaN rejected; unset = undefined (disabled).

### Integration: `test/integration/adapter-price.test.ts` (+ one other endpoint)

13. `price` endpoint: active stream stale (env set) → 503; fresh → 200. **Fails today.**
14. Same scenario against `coinbase` (or any registry endpoint) → proves the check covers all five
    endpoints via the shared path, per Open Questions Q4. **Fails today.**
15. UNKNOWN report → 503 at HTTP level. Passes today (pin).
16. Env unset + stale report → 200 (documents safe-rollback behavior). **Fails today** (only
    because the env var doesn't exist yet; passes trivially after).

### Checkpoint split

- **PR1 checkpoint 1 (tests, must fail):** 1–7, 11–14, 16 fail; 8–10, 15 pass (they pin existing
  correct behavior).
- **PR1 checkpoint 2 (implementation):** config vars, age-eligibility in `getStream`, error-message
  extension, metrics hooks (per monitoring plan) — all tests green.

## Rollout & verification plan

### Configuration changes per adapter / environment

- **tokenized-equity (this change):** four new optional env vars — `DS_VALID_MAX_AGE_SECONDS`
  (shared default; unset = check disabled) and `DS_VALID_MAX_AGE_SECONDS_{REGULAR,EXTENDED,OVERNIGHT}`
  overrides. Documented in the adapter README/env schema as part of PR1 checkpoint 2.
  Wiring lives in `infra-k8s/projects/adapters/files/adapters/data-feeds/tokenized-equity/config.yaml`
  per environment (stage / prod-testnet / prod values, see phases below).
- **data-engine:** no changes. The new check is consumer-side; data-engine keeps its existing
  behavior. (Its stale-report warn logs become useful corroborating evidence during incidents.)
- **tradinghours:** no changes.
- **DON feed configs (reference-data-directory):** no changes required. Leave
  `overnightStreamMaxAgeInSeconds` as currently configured; per the interaction decision it is now
  only an emergency per-asset escape hatch. Do NOT remove it from feed configs in this rollout.

### Phase 0 — ship dark (all environments)

- Deploy PR1 with metrics + check code but **no env vars set** → behavior identical to today.
- Verify: new metrics (`tokenized_equity_stream_report_age_seconds`,
  `tokenized_equity_stream_market_status`, `tokenized_equity_rejection_total`) appear on `/metrics`;
  rejection counter stays at ~zero; 503 rate/`bgExecuteErrors` unchanged from baseline; dashboards
  built and populating.
- Soak: at least one full week covering a weekend close + Sunday overnight open, to capture
  per-session age distributions in each environment's real traffic.

### Phase 1 — staging, loose thresholds

- Set loose values in stage config.yaml (starting point: shared `DS_VALID_MAX_AGE_SECONDS=300`,
  no per-session overrides).
- Verify (all against `https://adapters.main.stage.cldev.sh/tokenized-equity` or the metrics
  endpoint):
  - fresh requests pass through unchanged (200, prices match pre-change baseline);
  - `tokenized_equity_rejection_total{reason="stale"}` ≈ 0 during sessions;
  - rejection counter with `reason="market_closed"` rises only outside sessions (16:00/20:00 ET
    transitions + weekend — schedule the deploy early in a week so both are observed);
  - age gauges stay well below thresholds mid-session (confirm thresholds are not tight enough to
    flap).
- Synthetic staleness check: temporarily point one feed/stream at a stale-cached feedId (or set an
  absurdly tight override like `DS_VALID_MAX_AGE_SECONDS_REGULAR=1`) → expect 503s with the
  extended error message, then revert. This is the only reliable way to exercise the rejection path
  on demand.
- Tune per-session thresholds from observed age percentiles (and observed staging cadence data).

### Phase 2 — staging, final thresholds

- Set tuned per-session values; soak another week incl. a weekend + Sunday open.
- Verify alert wiring end-to-end: the synthetic-staleness trick from Phase 1 should fire the
  "stream frozen mid-session" page in staging's alertmanager; UNKNOWN alert verified by simulating/
  forcing an UNKNOWN report if feasible (otherwise alert reviewed but untested — note in sign-off).
- Sign-off criteria: zero unexpected `stale`/`unknown` rejections; `market_closed` rejections only
  in expected windows; no smoother-behavior regressions (spot-check kalman/ema outputs vs baseline
  around session transitions).

### Phase 3 — prod testnet

- Same two-step (loose → final) with shortened soak (a few days each); same verification checklist;
  DONs on testnet consume these EAs, so coordinate a heads-up that 503s outside sessions are
  expected behavior, not an outage.

### Phase 4 — prod

- Loose → final, full-week soaks. Announce in the feeds runbook that outside-session 503s are
  intended. Final thresholds recorded in config.yaml + this doc.

### Rollback

- Unset `DS_VALID_MAX_AGE_SECONDS` (env change, redeploy) → consumer-side check disabled
  instantly; behavior returns to current state. No DON config or data-engine changes to unwind.
- Rollback drill: execute once in staging during Phase 1 to prove it's a single env flip.

### Verification summary (what "done" looks like)

- Fresh mid-session requests: 200, unchanged prices.
- Stale active stream: 503 with per-stream age/threshold in the message; rejection counter
  increments with `reason="stale"`; nothing new published on-chain.
- UNKNOWN reports: 503, counter `reason="unknown"`, page fires.
- Closed market: 503, counter `reason="market_closed"`, no pages.
- Session starts: transient 503s until first fresh report, then clean pass-through (Sunday
  overnight open is the worst case — explicitly observed during soaks).

For /data-engine, find the mapping under reference-data-directory/data-streams/streams, seach by feed_id, eg for 0x000bbd87a23775b4c11092ae9a1fc7b3393636ae1dbb9f1ef460f845c0f4cff1, it is in the file reference-data-directory/data-streams/streams/1000009175.json

There are multiple Argo instances per cluster. The o11y argo instance (https://argo.o11y.prod.cldev.sh) is the observability cluster. They have the following format: https://argo.<cluster>.<env>.cldev.sh The one running the tokenized-equity and tradinghours EAs are in: https://argo.main.stage.cldev.sh/

You can find the running EAs for tokenized-equity and tradinghours there:

- https://argo.main.stage.cldev.sh/applications/adapter-tokenized-equity
- https://argo.main.stage.cldev.sh/applications/argocd/adapter-tradinghours-mercury

You can find these apps in the infra-k8s directory:

```bash
ls -1 projects/adapters/apps/adapter-tokenized-equity.yaml projects/adapters/apps/adapter-tradinghours-mercury.yaml
projects/adapters/apps/adapter-tokenized-equity.yaml
projects/adapters/apps/adapter-tradinghours-mercury.yaml

```

For the main clusters there is a gateway named `adapters`, swap the `argo` in the hostname: https://argo.main.stage.cldev.sh/ -> https://adapters.main.stage.cldev.sh/ to hit the EAs.

For HTTP requests, adapters.main.stage.cldev.sh is a gateway host (router) that forwards requests through to EAs in that environment (eg: main, the mainnet lane; stage, the staging cluster). The path segment /tokenized-equity routes to the ArgoCD app of the same name in that cluster

# Open Questions

- Q: How does the tokenized-equity EA determine which endpoint to hit on the data-engine EA?
  A: `getPrice()` is hardcoded to only call `getDeutscheBoersePrice`, which hardcodes the `feedId` to be `deutscheBoerse-v11` (though not as a constant)

- Q: where is `deutscheBoerse-v11` defined as a constant? This feels like something that should be defined once across the codebase.
  A: It is defined once: in the data-engine package itself, `packages/sources/data-engine/src/lib.ts`
  (`versionEndpointMap` maps report version V11 → 'deutscheBoerse-v11', and the exported typed helper
  `getDeutscheBoersePrice` passes that string to `callEA`). The composite imports the helper via
  `@chainlink/data-engine-adapter`, so tokenized-equity never hardcodes the endpoint string.

- Q: where does `overnightStreamMaxAgeInSeconds` get configured or passed in?, it is passed to `getPrice` (passed to the data-engine)
  A: It is a per-request input parameter (defined in `src/endpoint/common.ts`), i.e. its value comes
  from the caller — in production that's the DON feed config (reference-data-directory
  `externalAdapterGroupRequestParams`). `streams.ts getPrice()` forwards it to data-engine for the
  overnight stream only. See "Interaction with overnightStreamMaxAgeInSeconds" for how it relates to
  the new env-based check.

- Q: tokenized-equity supports multiple endpoints (not just `price`, but also `coinbase`, `ondo`, `robinhood`, and `xstocks`), are these two new behaviors isolated only to the `price` endpoint or are they to be supproted for all endpoints?
  A: All endpoints, automatically. Every endpoint's transport (`priceTransport`, `coinbasePrice`,
  `ondoPrice`, `robinhoodPrice`, `xstocksPrice`) funnels through the shared `smoothedStreamPrice()` →
  `getPrice()` → `getStream()` path. Implementing the staleness + UNKNOWN checks in `streams.ts`
  covers all five endpoints with one change. (The per-endpoint transports only add their own
  registry/on-chain lookups before calling the shared code.)

- Q: where is the enum defined for market status? (`TwentyfourFiveMarketStatus`), it'd be good to re-use a pre-existing enum vs redefining it in the tokenized-equity EA code.
  A: In the framework: `@chainlink/external-adapter-framework/adapter/market-status`
  (0=UNKNOWN, 1=PRE_MARKET, 2=REGULAR, 3=POST_MARKET, 4=OVERNIGHT, 5=WEEKEND). Tokenized-equity
  already imports it (`src/lib/streams.ts`, `src/transport/smoothedPrice.ts`) — no redefinition
  exists or is needed.
