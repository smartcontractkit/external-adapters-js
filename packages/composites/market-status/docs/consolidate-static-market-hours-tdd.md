# TDD: Consolidate `static-market-hours` into `market-status` and add a `market-session` endpoint

# 1. Problem Statement

Static market-hours configuration currently lives in a standalone EA
(`static-market-hours`) whose only consumer is the `market-status`
composite (this EA) — an extra deployed service, an extra hop, and a
second place where market-session truth is maintained. Separately,
consumers that need a labeled market _session schedule_ (not just the
current status) must call the `tradinghours` EA directly and invent
their own fallback when it is down: the `tokenized-equity` EA's
pre-market warm-up gating requires an NYSE 24/5 fallback schedule and
would need to duplicate the static fallback configuration (instead
this TDD proposes exposing the static fallback schedule from
`market-session`). If we make no changes, every new schedule consumer
would need similar fallback, there is a risk that the static schedules
drift across these EAs, and we keep operating an EA that exists only
to serve one other EA.

# 2. Goals

**Customer outcomes**

- No change in market-status answers for any market — consolidation is behavior-preserving for
  existing endpoints (this is a refactor plus an additive endpoint).
- `tokenized-equity` pre-market warm-up gating keeps full precision (true 09:30 regular open,
  Sunday 20:00 overnight open) during tradinghours outages, backed by reviewed static config
  instead of a hard-coded schedule in consumer code.

**Engineering/operational outcomes**

- One place for static market-session truth: the `market-status` EA owns the static schedule
  config (`${MARKET}_REGULAR_SCHEDULE` / `${MARKET}_24_5_SCHEDULE`) and evaluates it in-process.
- One fewer production service in the request path for CME/COMEX/NYMEX market status: the
  `STATIC_MARKET_HOURS` HTTP secondary becomes an in-process static source, like the existing
  `STATIC_NYSE_245` / `STATIC_JPX` / etc. sources.
- A new `market-session` endpoint on `market-status` returns a labeled session-transition
  schedule: tradinghours first, static configured schedule as fallback — so no consumer ever
  needs to hard-code venue hours again.
- optionally `static-market-hours` remains deployable as a thin backwards-compatible shim that delegates to
  `market-status`, so existing NOP/external deployments do not break; the static configuration
  itself lives only in `market-status`. See Risks & Open Questions.

**Measurable improvements**

- Zero HTTP hop and zero separate deployment for static market-hours fallback in the
  market-status path (baseline: 1 extra EA in the path for 15 CME/COMEX/NYMEX markets).
- `tokenized-equity` does not need a hard-coded `FALLBACK_SESSION_SCHEDULE` (baseline: 1 hard-coded
  schedule proposed in `tokenized-equity` code; target: 0).

# 3. Non-Goals

- **No changes to existing `market-status` / `multi-market-status` behavior** other than the
  source of static answers (in-process instead of over HTTP). Status values, fallback ordering,
  and the `force245MarketStatus` / `useSecondaryForTesting` semantics are unchanged.
- **No new data providers.** The `market-session` endpoint uses only tradinghours (existing
  primary) and the static configured schedule (existing fallback data, relocated).
- **No changes to the tradinghours EA.** Its `market-session` endpoint already exists and is
  consumed as-is.
- **No local caching of tradinghours responses** in `market-status` beyond the framework's
  existing transport cache/background-execute behavior. A proper schedule cache is separate
  follow-up work ([DF-28220](https://smartcontract-it.atlassian.net/browse/DF-28220)).
- **No forced migration of external `static-market-hours` deployments.** The shim preserves the
  `static-market-hours` API; sunsetting the package entirely is a later decision once external
  usage is confirmed gone.
- **No per-request schedule overrides.** Schedule selection is by `market`/`type` only;
  all configuration remains instance-level env vars.

**Accepted tradeoff:** the static schedules move from a standalone EA's env config into the
`market-status` EA's env config. Operators of the `market-status` composite take on the schedule
env family; operators of standalone `static-market-hours` deployments keep them working via the
shim (which needs only a `MARKET_STATUS_ADAPTER_URL`).

# **Technical Details**

# 4. Proposed Design

Two independent features land in one release, both in the `market-status` composite.

## Feature 1 — Subsume `static-market-hours`

### Today

`market-status` resolves status per market via a primary/secondary source map
(`src/source/sources.ts`). For 15 CME/COMEX/NYMEX markets the secondary is
`STATIC_MARKET_HOURS`, reached by HTTP POST to `STATIC_MARKET_HOURS_ADAPTER_URL`
(`{ data: { endpoint: 'market-status', market, type, weekend } }`). The `static-market-hours`
source adapter evaluates JSON-encoded `Schedule` objects from its own env vars
(`${MARKET}_REGULAR_SCHEDULE`, `${MARKET}_24_5_SCHEDULE`; validated at startup by
`getScheduleValidationError`), checking exceptions (holidays/early closes) first, then weekly
day/time windows in the schedule's timezone, then `defaultStatus`. Other markets already use
**in-process** static sources (`STATIC_NYMEX`, `STATIC_JPX`, `STATIC_NYSE_245`, …) that need no
network call — `static-market-hours` is the odd one out purely for historical reasons.

### Proposed

1. **Move the schedule machinery into `market-status`.** Port `util/schedule.ts` (the
   `Schedule` type, `getScheduleValidationError`, `getStatusStringFromSchedule`, TZDate-based
   evaluation) from `packages/sources/static-market-hours` into
   `packages/composites/market-status/src/source/static-config.ts` (or a shared framework
   location — see alternatives). No logic changes; the code and its unit tests move as-is.
2. **Move the config.** `market-status` gains the same env family:
   `${MARKET}_REGULAR_SCHEDULE` / `${MARKET}_24_5_SCHEDULE` (sensitive, validated at startup with
   the ported validator). Optional — a `market-status` instance that configures no schedules
   behaves exactly as today (static secondary simply answers UNKNOWN, same as an unreachable
   `static-market-hours` does today).
3. **Add an in-process source `STATIC_CONFIG`.** Registered like the existing `static-*.ts`
   sources; it answers `market-status` requests by evaluating the configured `Schedule` for the
   requested market/type. In `marketSources`, the 15 CME/COMEX/NYMEX entries switch their
   secondary from `STATIC_MARKET_HOURS` (HTTP) to `STATIC_CONFIG` (in-process).
4. **Backwards compatibility for `static-market-hours` deployments (shim).** An alternative option
   is to deprecate the `static-market-hours` EA instead of providing backwards compatibility. The
   `static-market-hours` package is updated so that, instead of requiring the schedule env vars,
   it accepts `MARKET_STATUS_ADAPTER_URL` and delegates each `market-status` request to the
   `market-status` EA (which now owns the static config and evaluates it in-process). The shim:

   - keeps the `static-market-hours` name, endpoint (`market-status`), input params, and output
     schema byte-identical;
   - requires exactly one of the two modes: legacy mode (schedule env vars present — evaluate
     locally, current behavior) or delegate mode (`MARKET_STATUS_ADAPTER_URL` present — forward
     and return the response). Delegate mode is the recommended configuration going forward;
     legacy mode is kept only to make the shim releasable without a flag day, and logs a
     deprecation warning at startup.
   - keeps `ALLOW_AT_TIMESTAMP_FOR_TESTING` working in both modes (forwarded as a param in
     delegate mode; `market-status` gates it behind the same env var — see §8).

   Because the only in-repo caller of `static-market-hours` is `market-status` itself (which
   stops calling it in step 3), the shim exists purely for external/NOP deployments we do not
   control. This is the chosen option over a hard migration: we cannot migrate callers we don't
   own, and a delegating shim keeps the static configuration in exactly one place
   (`market-status`) while leaving those deployments functional.

### Why this design / alternatives rejected

- **Shim (chosen) vs hard migration of all callers.** In-repo, migration is trivial (the only
  caller is `market-status` itself). Out-of-repo, NOPs run `static-market-hours` as part of
  market-status stacks; a hard migration would silently break their fallback the day the package
  is removed or their config stops being read. The shim converts the break into a config change
  with identical behavior, and still achieves the single-source-of-truth goal because the
  schedule config is only ever read by `market-status`.
- **In-process evaluation (chosen) vs keeping the HTTP secondary pointed at a shim.** The
  existing `STATIC_*` in-process sources prove the pattern: no network failure mode, no extra
  latency, no extra service to operate. Keeping an HTTP hop inside our own stack buys nothing.
- **Port into `market-status` (chosen) vs promote `schedule.ts` to the EA framework.** The
  framework is shared by every EA; a schedule DSL used by exactly one composite doesn't belong
  there yet. If a third consumer appears, promoting it is a mechanical move — noted as an open
  question (§12), not done now.
- **Not deleting `static-market-hours` in this release.** Deletion is a one-way door with no
  upside until external usage is confirmed zero; the shim captures all the value now.

## Feature 2 — `market-session` endpoint on `market-status`

### Motivation

The `tokenized-equity` EA's pre-market warm-up gating feature (see
`packages/composites/tokenized-equity/docs/stream-freshness-gating-tdd.md`) needs a **labeled
session schedule** — the list of timed transitions that open each session (PRE_MARKET 04:00,
REGULAR 09:30, POST_MARKET 16:00, OVERNIGHT 20:00, for NYSE 24/5). In its initial design it fetches this from the
tradinghours EA's `market-session` endpoint and, on outage, falls back to a **hard-coded labeled
schedule in its own source** (`nyse/24/5` only). That hard-coded schedule is exactly the kind of
static venue knowledge that should live in one reviewed place — and `static-market-hours` config
(Feature 1, now in `market-status`) already expresses richer schedules (weekly windows plus dated
exceptions) with startup validation and a CSV-based generator (`generate-tradinghours-json`).

### Proposed

New endpoint `market-session` on the `market-status` EA:

- **Input params:** `market` (required), `type` (`regular` | `24/5`, default `regular`),
  `timezone` (required — the timezone the caller evaluates in, e.g. `America/New_York`; mirrors
  the tradinghours endpoint), and `atTimestampSeconds` (testing-only, same gating as
  `static-market-hours` today).
- **Output:** a labeled transition list in the same shape the tradinghours `market-session`
  endpoint returns, so existing consumers can switch base URL without parsing changes:

  ```json
  {
    "data": {
      "result": [
        { "status": 2, "statusString": "PRE_MARKET", "time": "2026-11-03T04:00:00-05:00" },
        { "status": 3, "statusString": "REGULAR", "time": "2026-11-03T09:30:00-05:00" }
      ]
    }
  }
  ```

  plus a `sessionSource: 'TRADINGHOURS' | 'STATIC_CONFIG'` field on the response (mirroring the
  field `tokenized-equity` already surfaces) so fallback activation is visible per request.

- **Resolution order:**

  1. **tradinghours `market-session`** — authoritative, holiday/early-close aware. Reached via
     `TRADINGHOURS_ADAPTER_URL` (already a configured dependency of `market-status`).
  2. **Static configured schedule (`STATIC_CONFIG`)** — the `Schedule` for the requested
     market/type (Feature 1's config) is **projected into a transition list** for the window
     tradinghours would have covered (yesterday → tomorrow in the requested timezone): each
     weekly window start becomes a transition opening that window's status; each exception
     contributes its own start transitions; `defaultStatus` gaps contribute no transitions
     (nothing "opens"). The projection reuses the ported schedule code — same TZDate handling,
     same exceptions-first semantics — so a schedule that passes startup validation always
     projects deterministically.
  3. If neither can produce a schedule (tradinghours unreachable **and** no static schedule
     configured for the market/type), the endpoint returns a 4xx/5xx with a distinct message
     (`Market session schedule unavailable for <market>/<type>`) — loud rather than silently
     wrong, matching the `tokenized-equity` "503 when no fallback exists" behavior.

- **Failure behavior:** identical in spirit to the existing status fallback — a source that
  errors or answers with an empty/UNKNOWN-only schedule is treated as "no answer" and falls
  through. One distinction from the status path: there is no per-market source map for
  `market-session`; the order is always tradinghours → static config, because the static
  schedule is by definition the universal fallback.

### Consumer migration (`tokenized-equity`, follow-on PR)

`tokenized-equity` replaces its `TRADING_HOURS_ADAPTER_URL` `market-session` fetch with a
`MARKET_STATUS_ADAPTER_URL` `market-session` fetch and **deletes** its hard-coded
`FALLBACK_SESSION_SCHEDULE` and `getGatingTimezone` map — the fallback schedule and its timezone
now live in `market-status` config, and the response's `sessionSource` field preserves the
existing observability (`'STATIC_CONFIG'` replaces `'FALLBACK'`). Gating behavior is unchanged:
same transitions, same fail-closed 503 when no schedule is available. This migration is a
follow-on change to keep this TDD's blast radius to `market-status` + `static-market-hours`.

### State changes

None. No persistence, no caches beyond existing framework transport caching; schedules are parsed
from env at startup (ported behavior) and tradinghours responses are fetched per the transport's
existing background-execute cadence.

### Constraints

- The static `Schedule` type models **status windows**, not labeled opens; projecting it to
  transitions assumes each window start opens that window's status. This holds for every
  schedule generated by `generate-tradinghours-json` (they are contiguous per session type) but
  is a semantic to document on the endpoint.
- `lastValidDate` on static schedules means the fallback has a built-in expiry — a lapsed
  schedule fails startup validation, which is the desired loud behavior but an operational date
  to track (§5).

# 5. Operations

### What changes operationally

- The `STATIC_MARKET_HOURS_ADAPTER_URL` env var on `market-status` deployments is replaced by
  the `${MARKET}_REGULAR_SCHEDULE` / `${MARKET}_24_5_SCHEDULE` env family for the 15
  CME/COMEX/NYMEX markets (the same values, moved). Until schedules are configured, those
  markets' secondary answers UNKNOWN — identical to the current behavior when
  `static-market-hours` is down, so a mis-sequenced deploy degrades exactly like a known failure
  mode rather than something new.
- One fewer service in the stack; `static-market-hours` pods can be removed from market-status
  deployments once the shim's delegate mode is confirmed (or kept running in delegate mode for
  external callers during the deprecation window).

### Observability

- No new instrumentation. The framework's HTTP metrics cover the new endpoint; static-source
  evaluations produce no external call, so a market relying on `STATIC_CONFIG` is visible in
  `market-status`'s structured logs (source name in the existing log lines) and, for
  `market-session`, in the `sessionSource` response field.
- Log queries (Loki/LogQL), consistent with the tokenized-equity TDD's patterns:
  - `|= "sessionSource" |= "STATIC_CONFIG"` — fallback schedule in use.
  - `|= "Market session schedule unavailable"` — both sources failed; alert-worthy during
    sessions that should be covered.

### Alerts

- **Page:** `Market session schedule unavailable` during what should be a covered session, or
  sustained `sessionSource: STATIC_CONFIG` (indicates a tradinghours outage — pair with the
  tradinghours EA's own availability alerts).
- **Page (new, cheap):** `market-status` startup failure caused by schedule validation —
  specifically `lastValidDate` expiry on a configured static schedule. Today that failure lands
  on `static-market-hours` startup; it moves with the config.
- **Never alert:** `STATIC_CONFIG` answering UNKNOWN for a market outside its hours — that is
  the static schedule working as designed.

### Prove working / prove not broken

- **Working:** for each migrated market, diff `market-status` answers before/after the
  secondary switch over a full week (weekdays, a weekend, and ideally a holiday/early close);
  answers must be identical. `ALLOW_AT_TIMESTAMP_FOR_TESTING` makes this deterministic: replay a
  fixed timestamp grid against old and new paths.
- **Not broken:** 200-rate and latency for `market-status`/`multi-market-status` unchanged
  (latency should _improve_ marginally for the 15 migrated markets — one fewer HTTP hop);
  `market-session` returns tradinghours-shaped responses with `sessionSource: TRADINGHOURS` in
  normal operation and `STATIC_CONFIG` when tradinghours is force-disabled in staging.

### New operational burden

- `market-status` operators now own the schedule env family and its `lastValidDate` renewals
  (previously `static-market-hours` operators — same team, same data, new location).
- The shim's dual-mode config is one more thing to document in `static-market-hours`' README.

# 6. Rollout & Rollback

### Phasing

1. **Ship `market-status` with `STATIC_CONFIG` + `market-session`, config unset.** Zero behavior
   change: the 15 markets' secondaries answer UNKNOWN (equivalent to today's
   `static-market-hours`-down state, which already falls through to UNKNOWN), and the new
   endpoint is unused.
2. **Move the schedule env vars** from `static-market-hours` deployments to `market-status`
   deployments (same values). Replay-based verification per §5 (fixed-timestamp diff) before
   proceeding.
3. **Ship the `static-market-hours` shim.** Existing deployments keep working in legacy mode;
   switch them to delegate mode (`MARKET_STATUS_ADAPTER_URL` set, schedule env vars removed) at
   the next routine deploy. Announce deprecation of legacy mode in release notes.
4. **(Follow-on)** `tokenized-equity` migrates its schedule fetch to `market-status` and
   deletes its hard-coded fallback schedule. Gated by its own staging soak per its TDD.
5. **(Later, separate decision)** remove `static-market-hours` legacy mode / retire the package
   once external usage is confirmed zero.

### Rollback

- Steps 1–2: remove the schedule env vars from `market-status` (reverts to UNKNOWN secondary) or
  redeploy the previous image; `static-market-hours` is still running and unchanged at this
  point, so full rollback is a redeploy of either side.
- Step 3: the shim's legacy mode is the rollback — restore the schedule env vars.
- No state, no migrations, no data changes anywhere in the plan.

### One-way-door risks

None in this release. Package deletion (step 5) is the only one-way door and is explicitly
deferred.

### Release blockers

- Fixed-timestamp replay diff (§5) clean for all 15 migrated markets across a week including a
  holiday.
- `market-session` parity check against the tradinghours EA's endpoint for `nyse`/`24/5`
  (the market `tokenized-equity` gates on).

### NOP impact

NOPs running a market-status stack get: one fewer EA to run (after shim adoption), the same env
vars in a new place, and a deprecation notice for `static-market-hours` legacy mode. No action
is required of NOPs on release — their existing `static-market-hours` deployments keep working.

# 7. Success Metrics

- **Consolidation correctness:** zero mismatches in the fixed-timestamp replay diff across the
  15 migrated markets (baseline: n/a — this is a correctness gate, not a trend metric).
- **Service count in the market-status request path:** static fallback for CME/COMEX/NYMEX
  served in-process (baseline: 1 extra EA + 1 extra HTTP hop; target: 0).
- **Fallback precision for warm-up gating:** after the `tokenized-equity` follow-on, gating
  during a tradinghours outage uses the reviewed static schedule (true 09:30 open, Sunday 20:00
  overnight open, holiday exceptions) instead of the hard-coded map (baseline: 1 hard-coded
  schedule in consumer code; target: 0; success = no `PRE_SESSION`/`Market is not open`
  misbehavior attributable to fallback drift during any tradinghours outage in the first month).
- **Guard metric:** `market-status` 200-rate and status-value distribution per market unchanged
  vs the pre-rollout baseline (catches a bad port of the schedule evaluation).

# **Supporting Details**

# 8. Interface & Data Changes

- **`market-status` EA:**
  - New endpoint `market-session` (additive): params `market`, `type`, `timezone`,
    `atTimestampSeconds` (testing-only); response = tradinghours-shaped transition list +
    `sessionSource`.
  - New optional env family `${MARKET}_REGULAR_SCHEDULE` / `${MARKET}_24_5_SCHEDULE`
    (sensitive, startup-validated) and `ALLOW_AT_TIMESTAMP_FOR_TESTING` (default `false`,
    gates `atTimestampSeconds` on both `market-status` and `market-session`).
  - `STATIC_MARKET_HOURS_ADAPTER_URL` becomes unused; kept accepted-but-ignored for one release
    to avoid breaking existing env configs, with a startup deprecation log.
- **`static-market-hours` EA:** gains optional `MARKET_STATUS_ADAPTER_URL`; schedule env vars
  become optional in delegate mode. Endpoint, params, and output schema unchanged in both modes.
- **`tokenized-equity` (follow-on, not this release):** schedule fetch base URL and env var
  change; `sessionSource` value `'FALLBACK'` → `'STATIC_CONFIG'` (a log/response-string change
  to call out in its release notes).
- **Backwards compatibility:** existing endpoints byte-identical when no new config is set.
  **Rollback of interface changes:** redeploy; all config is env-based.

# 9. Security

**Impact: Low.**

- No new external services: tradinghours is an existing dependency; the static schedule is
  local config. The shim introduces one new EA-to-EA call pattern (`static-market-hours` →
  `market-status`) between already-internal services.
- Schedule env vars are already `sensitive: true`; that classification moves with them. They are
  market hours, not credentials, but keep the existing treatment (they reveal operational
  detail and are managed by the same secret pipeline).
- `ALLOW_AT_TIMESTAMP_FOR_TESTING` now gates a param on the `market-status` composite, not just
  a source EA — it must stay default-false in production; startup validation and release
  checklist cover this.
- The schedule projection is pure computation over reviewed static data — no injection vector;
  startup validation (timezone validity, overlap checks, `lastValidDate`) is ported unchanged.
- No PII, no compliance/privacy surface. No Product/Infra Security review expected beyond team
  convention for an internal, additive, reject-only-when-misconfigured change.

# 10. Testing Plan

Highest-risk paths and how each is validated (unit/integration tests expected in code; this is
the risk map):

1. **Schedule evaluation parity.** The ported `schedule.ts` keeps its existing unit tests
   verbatim. Additionally, the fixed-timestamp replay diff (§5) against the live
   `static-market-hours` is the authoritative parity check: a grid of timestamps (weekday,
   weekend, holiday, early close, DST boundary) × 15 markets × both types must produce
   identical statuses. `ALLOW_AT_TIMESTAMP_FOR_TESTING` exists for exactly this.
2. **Schedule → transition projection (new logic, highest risk).** Unit tests: weekly windows
   become opens at the right local instants; exceptions override weekly windows; `defaultStatus`
   contributes no transitions; overnight windows crossing midnight; DST transition weeks in
   `America/New_York`; a market/type with no schedule → `unavailable` error. Golden-file parity
   for `nyse`/`24/5`: projected static transitions vs a recorded tradinghours response on a
   normal (non-holiday) week — they must agree on all session opens.
3. **`market-session` fallback ordering.** Integration tests with tradinghours (a) healthy,
   (b) erroring, (c) returning an unusable/empty schedule, asserting `sessionSource` and the
   fail-closed error when both are unusable.
4. **Shim dual-mode.** Unit/integration tests that legacy mode behaves byte-identically to the
   current adapter, and delegate mode forwards params (including `atTimestampSeconds`) and
   passes through responses and error statuses.
5. **No regression with config unset.** The full existing `market-status` suite (including
   snapshots for the 15 migrated markets) must pass with the new code and no schedule env —
   secondaries answer UNKNOWN instead of calling out, which is the asserted behavior change.
6. **Empirical validation.** Staging: force tradinghours down, confirm `market-session` serves
   `STATIC_CONFIG` and the `tokenized-equity` gating soak (Thursday→Monday per its TDD) passes
   against it in the follow-on.

# 11. Ownership

- **Owning team:** data-feeds — owner of both `market-status` and `static-market-hours` today.
- **On-call:** unchanged — the existing EA rotation; **no new pager**. `static-market-hours`
  alerting folds into `market-status`'s as the config moves.
- **New operational responsibilities created:** `lastValidDate` renewal for the static schedules
  now lands on `market-status` deploys (same data, new home); eventual package retirement of
  `static-market-hours` (step 5) needs an owner when scheduled.
- **Sign-offs:** data-feeds team + PM.
- **Follow-ups (out of scope here):** `tokenized-equity` migration (step 4);
  tradinghours schedule caching ([DF-28220](https://smartcontract-it.atlassian.net/browse/DF-28220)).

# 12. Risks & Open Questions

| #   | Item                                                                                                                                                                                                                                                                     | Impact                                                                                                         | Likelihood                                                            | Mitigation                                                                                           | Owner |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----- |
| 1   | **Shim vs hard migration needs PM/ops sign-off.** This TDD proposes the backwards-compatible shim over migrating all callers.                                                                                                                                            | Changes deprecation timeline                                                                                   | —                                                                     | Raise at review; the in-repo migration (step 2) is identical under either option                     | TBD   |
| 2   | **External `static-market-hours` usage is assumed, not verified.** We believe NOPs run it in market-status stacks, but have no census.                                                                                                                                   | A wrong assumption either way is cheap: shim covers usage; lack of usage just means faster retirement (step 5) | Medium                                                                | Check deployment charts / NOP configs before scheduling step 5                                       | TBD   |
| 3   | **Projection semantics for unusual schedules.** Window-start-opens-status holds for generated schedules; a hand-written schedule with disjoint same-status windows still projects correctly, but exotic configs (overlapping exceptions across midnight) deserve review. | Wrong fallback transitions for markets we don't serve today                                                    | Low — all production schedules come from `generate-tradinghours-json` | Golden-file parity test (#2 in §10); code review of any new static schedule                          | TBD   |
| 4   | **`lastValidDate` expiry moves blast radius.** An expired schedule now fails `market-status` startup (all endpoints), not a sidecar EA's.                                                                                                                                | Deploy blocked until env updated                                                                               | Low — dates are set far out and renewals are routine                  | Startup-validation alert (§5); runbook entry with the renewal command (`generate-tradinghours-json`) | TBD   |
| 5   | **Open question: promote `schedule.ts` to the EA framework?** A third schedule consumer would justify it.                                                                                                                                                                | n/a — deferred                                                                                                 | —                                                                     | Revisit when `tokenized-equity` follow-on lands and any other consumer appears                       | TBD   |

# **Additional Considerations**

### New Product / Service?

No — consolidation of an existing service into an existing one, plus one additive endpoint.
Shutdown path for `static-market-hours` is the phased deprecation in §6.

### Data Model Changes?

No storage, schemas, migrations, or backfills. Configuration (env vars) relocates between two
EAs' deployment configs; values are unchanged.

### Customer Impact?

- **Customer communication:** release notes only — no behavioral change to any served answer;
  note the `static-market-hours` deprecation and the new `market-session` endpoint.
- **GTM coordination:** none.

### NOP Impact?

- **Rollout strategy:** none required of NOPs at release; the shim keeps existing deployments
  working. Adoption is: move schedule env vars, set `MARKET_STATUS_ADAPTER_URL`, drop the old
  pods — at their own pace.
- **Operational changes:** one fewer EA to run after adoption; deprecation notice for legacy
  mode travels with release notes.

# References

- Google Doc Mirror of this TDD (for socialization and feedback): [2026-11-04 | Consolidate static-market-hours into market-status](https://docs.google.com/document/d/1t0OQrrObzlipGSB2mkDKNJN7JGvgKSCitgpfkiG_ZWc/edit?tab=t.0)
