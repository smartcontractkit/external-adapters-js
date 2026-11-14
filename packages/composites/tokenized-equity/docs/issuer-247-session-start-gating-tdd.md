# 1. Problem Statement

The 24/7 tokenized-equity endpoint (`issuer-price-247`, introduced by
[ADR-0001](./adr/0001-issuer-price-247-is-a-new-issuer-agnostic-endpoint.md)) serves prices
around the clock from a single 24/7 Data Streams feed. It performs **no check on when the
report was produced relative to the current market session**: it consumes whatever report the
stream delivers, so a report from a previous session can reach the tokenized-equity with a `lastSeenTimestampNs`
from before the current session start, be labeled with the current session and 24/7 would consider it
a valid, fresh price when it should discard it..

This is the same **pre-session "warm-up" / leftover-report** failure
mode (though pre-session "warm-up" is not a risk for 24/7 streams as
the data-engine has already filtered away pre-session reports) that
motivated session-start gating on the 24/5 path (see the [stream
freshness gating TDD](./stream-freshness-gating-tdd.md) §1 and
[ADR-0006](./adr/0006-session-start-gating-no-tolerance-and-hard-coded-fallback.md)):
providers transmit invalid placeholder prices before a session open,
carrying fresh timestamps, and only guarantee validity for updates
timestamped after the open. On 24/5 this produced spurious onchain
moves at session opens that typically corrected within a minute. The same check
also covers the mirror-image case: the provider simply not having
published yet after a session open, so the report being served still
carries a `lastSeenTimestampNs` from the previous session. The 24/7
feed trades through every underlying equity session boundary —
pre-market, regular, post-market, overnight, and the weekend — so it
is exposed to the same failure mode at every one of those boundaries,
and today has no protection at any of them.

ADR-0001 deliberately specified "No Market Status gate" for 24/7 on the grounds that a 24/7
Price is priced around the clock. That remains correct for _market-closed_ gating (the feed
keeps serving through weekends and holidays). It does not follow that _session-start_ gating is
unnecessary: around-the-clock pricing multiplies the number of session boundaries crossed, it
does not eliminate them.

## 2. Goals

**Customer outcomes**

- No spurious onchain moves at session opens on 24/7 feeds: a report whose
  `lastSeenTimestampNs` predates the start of the session it belongs to is rejected (503)
  instead of published, even when it is fresh by age (a tighter tolerance for a stale price from before the session start).
- 24/7 availability preserved: the feed keeps serving around the clock — no market-closed 503
  is introduced. Gating only ever rejects _pre-session_ reports.

**Engineering/operational outcomes**

- Session-start policy enforced in one place — the `issuer-price-247` price path — configured
  per instance via env vars, with no request-parameter or feed-config changes required to adopt.
- The session is read from the **report's own `marketStatus`** field; session start times come
  from the tradinghours `market-session` schedule, falling back to a hard-coded schedule — the
  same two-tier schedule source as 24/5 gating.
- Full weekend coverage: unlike 24/5, a 24/7 report can arrive during the weekend, so the
  schedule model gains a first-class WEEKEND session start (Friday post-market close).
- Ships dark (disabled by default); enabled per environment. Rejection reasons reuse the exact
  24/5 log/response conventions, so existing dashboards, alerts, and runbooks carry over.

**Measurable improvements**

- Zero onchain updates on 24/7 feeds whose underlying report predates its session start after
  rollout.
- Rejection rate per reason queryable from logs, so intended rejections (gating working) are
  distinguishable from provider degradation.

## 3. Non-Goals

- **No staleness (max-age) gating on 24/7.** Only session-start gating is ported. A staleness
  check for `issuer-price-247` remains a separate follow-up (as already noted in the 24/5 TDD).
- **No market-closed gating.** The 24/7 feed prices around the clock; a report that belongs to
  the current session is served regardless of whether the underlying equity market is open.
- **No changes to data providers or data-engine.** Gating is consumer-side.
- **No behavior synthesis in the tradinghours adapter.** The only tradinghours change is an
  additive passthrough of the already-present phase `end` field (§4). WEEKEND derivation lives
  in tokenized-equity.
- **No changes to 24/5 gating behavior.** The fallback-schedule flatten (§4) refactors shared
  configuration but must leave 24/5 decisions byte-identical.
- **No new _required_ request parameters.** All configuration is instance-level env vars. (The
  existing optional `marketSessionOverride` test hook is extended to this endpoint, §8.)
- **No new metrics/telemetry instrumentation.** Observability is log-based, reusing the 24/5
  message conventions.
- **No default enablement.** The check ships dark; rollout is staged (§6).

**Accepted tradeoff:** rejection (503) is the mitigation mechanism. During provider warm-up at a
session boundary, 24/7 feeds hold their last onchain value rather than printing a pre-session
report — correctness is deliberately prioritized over freshness at session opens.

# **Technical Details**

## 4. Proposed Design

### Overview

The check is enforced at a single point in the `issuer-price-247` price path
(`src/price/issuerPrice247.ts`), after the data-engine report is fetched and before the price is
computed:

1. Read the report's `marketStatus` (the `TwentyfourFiveMarketStatus` enum carried on the v11
   report). This is the session the report belongs to.
2. Resolve the **start time of that session** from the tradinghours `market-session` schedule
   (tier 1), falling back to the hard-coded schedule (tier 2).
3. Reject with 503 `Market data predates session start: … PRE_SESSION(...)` when the report's
   `lastSeenTimestampNs` predates that session start — **zero tolerance**, same as 24/5
   (ADR-0006's no-tolerance stance is extended to 24/7 by ADR-0007).

This inverts one 24/5 design choice deliberately: 24/5 gating never reads per-report session
info (it gates the _selected stream_ against schedule-derived sessions). On 24/7 there is only
one stream and no selection — the report itself declares its session via `marketStatus`, and we
gate against that session's start.

Note the two sides of the comparison come from **independent calendar sources**: the report's
`marketStatus` is determined upstream by the data-engine from a static `calendar_json` runtime
config (weekly template + dated holiday exceptions; no live API), while the session start is
resolved here from the tradinghours EA's live schedule (with the hard-coded fallback). The
vocabularies match by design (both use the 0–5 status enum, where 5 means closed — weekend or
holiday), but the calendars are updated by different processes and can drift; see §12 #6.

### Status → session-start mapping

| Report `marketStatus`              | Session start used for gating                                   |
| ---------------------------------- | --------------------------------------------------------------- |
| `REGULAR` (2)                      | Most recent `REGULAR` transition (09:30 ET)                     |
| `PRE_MARKET` / `POST_MARKET` (1/3) | Most recent `PRE_MARKET` transition (04:00 ET)                  |
| `OVERNIGHT` (4)                    | Most recent `OVERNIGHT` transition (20:00 ET)                   |
| `WEEKEND` (5)                      | Most recent **weekend start** (Friday post-market close, below) |
| `UNKNOWN` (0) / unmapped           | Indeterminate — see fail-on-indeterminate flag (§8)             |

Rationale for `PRE_MARKET`/`POST_MARKET` sharing the 04:00 pre-market open: both belong to the
continuous extended-hours session that begins at 04:00 ET — mirroring the 24/5 eligible-status
grouping (extended stream = PRE_MARKET/POST_MARKET).

### The WEEKEND session start

A 24/7 feed reports through the weekend, but neither schedule source models a weekend session
today: the upstream tradinghours hours-multiday API represents the weekend purely as an
**absence of phases** (Friday post-market end → Sunday overnight start), and the tradinghours
`market-session` endpoint can never emit a `WEEKEND` transition.

Design: the weekend session start is **the `endTime` of the last `POST_MARKET` phase before the
weekend gap** — Friday 20:00 ET in the normal week. This is derived in tokenized-equity from
the tradinghours schedule. It is deliberately _not_ Friday's post-market _open_: the weekend
session begins when post-market trading ends.

To make this derivable, the tradinghours `market-session` transport gains an **additive
passthrough of the phase `end` field** as `endTime` on each emitted transition. The upstream
API already returns `end` per phase; the parser receives it today and discards it. This is a
pure-plumbing change: tokenized-equity is the endpoint's only consumer in the monorepo, the
field is additive to the response shape, and no existing field or behavior changes. Deriving
from real phase end times (rather than a hardcoded 20:00 or a post-market-start-plus-duration
rule) keeps holiday early-closes (e.g. a 13:00 ET close before July 4th) correct.

The hard-coded fallback schedule is extended congruently: its entries gain the same `endTime`
data (Friday post-market ends 20:00 ET), so the fallback path computes the weekend start with
the same code and the same arguments as the tradinghours path.

**Holidays are covered by the same mechanism.** The ecosystem reports a full-day closure with
`marketStatus: WEEKEND` (the tradinghours `market-status` catch-all maps `Closed` plus an
unrecognized reason — e.g. a holiday name — to `WEEKEND`), and the derivation above is really
"start of the current closed span": on Thanksgiving week the last `POST_MARKET` `endTime` is
Wednesday 20:00 ET, so reports arriving during the holiday are gated against that — correctly,
with no holiday-specific code. (The fallback schedule stays holiday-unaware, an already
accepted risk, §12 #3.) See
[tradinghours ADR-0001](../../../sources/tradinghours/docs/adr/0001-market-session-exposes-phase-end-times.md)
for the closed-span model.

### Flattened hard-coded fallback schedule

`FALLBACK_SESSION_SCHEDULE` is restructured from per-`market/type` keys (`nyse/24/5`,
`nyse/regular`) to a **single per-market entry** (`nyse`) holding the four session opens —
PRE_MARKET 04:00, REGULAR 09:30, POST_MARKET 16:00, OVERNIGHT 20:00 (Sun–Thu) — plus per-phase
end times, shaped congruently with the tradinghours response. Like the upstream model, the
weekend/holiday closed span is an absence of phases (its start is Friday's post-market end,
20:00 ET), so both schedule sources resolve the WEEKEND start through the **same derivation**
(`closedSpanStartMs`) — there is deliberately no explicit WEEKEND entry. Session times are
extracted into named constants so no time literal is duplicated.

Each `marketType` sees a filtered **view** of the one schedule: `regular` callers get only
REGULAR opens (the pre-flatten narrowing is preserved exactly), while `24/5` and `24/7` callers
share the full four-session view. 24/5 gating decisions are unchanged by construction (same
transitions, same filter), the fallback path uses the same arguments as the tradinghours path,
and no hardcoded configuration is duplicated.

A market without an entry still gets **no fallback**: with gating enabled and tradinghours
unusable, the request 503s — loud rather than silently wrong (unchanged from ADR-0006).

### Indeterminate sessions and the fail-on-indeterminate flag

Two indeterminate cases: (a) the report's `marketStatus` is `UNKNOWN` (0) or unmapped, (b) the
session start cannot be resolved from either schedule tier (e.g. tradinghours down and no
fallback entry, or no matching transition).

Controlled by `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION` (default **true**):

- **true (fail closed):** 503 `Session start unknown` — the 24/5 "loud rather than silently
  wrong" stance, extended to 24/7. This is the planned rollout posture.
- **false (fail open):** serve the report and log a warning. Exists so the decision can be
  relaxed without a code change if Product's risk posture changes — note that 24/7 has
  historically never gated, so fail-closed turns previously-good responses into 503s during
  tradinghours outages; that is a deliberate, Product-accepted posture (ADR-0007), and this
  flag is the escape hatch.

When the main gating flag is off, no gating occurs regardless of this flag.

### State changes

None. No persistence, no caches, no stored state; the schedule is fetched per request and every
request is evaluated independently.

### Failure behavior: decision matrix

One row per outcome of an `issuer-price-247` request with the report fetched.

| #   | gating flag | report `marketStatus`                     | schedule                           | lastSeen vs session start | Outcome                                                                                                       |
| --- | ----------- | ----------------------------------------- | ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | off         | any                                       | — (no fetch made)                  | —                         | **200** pass-through (legacy behavior; ship-dark default)                                                     |
| 2   | on          | mapped, in-session                        | ✅ start resolved                  | ≥ start                   | **200**                                                                                                       |
| 3   | on          | mapped                                    | ✅ start resolved                  | < start                   | **503** `Market data predates session start: … PRE_SESSION(...)` — pre-session leftover, even if fresh by age |
| 4   | on          | mapped                                    | ❌ tradinghours down/unusable      | vs **fallback** start     | rows 2/3 apply against the fallback start. **503** only if the market has no fallback entry                   |
| 5   | on          | `WEEKEND`                                 | ✅ post-market `endTime` available | ≥ weekend start           | **200** — weekend report gated against Friday post-market close                                               |
| 6   | on          | `WEEKEND`                                 | ✅                                 | < weekend start           | **503** `PRE_SESSION` — Friday-evening leftover served over the weekend                                       |
| 7   | on          | `UNKNOWN`/unmapped, or start unresolvable | —                                  | —                         | fail-on-indeterminate **true** → **503** `Session start unknown`; **false** → **200** with warning log        |

### Why this design / alternatives rejected

- **Session from the report, not the schedule.** With one 24/7 stream there is no selection to
  gate; the report's `marketStatus` is the authoritative declaration of which session produced
  it. Gating that session's start is the tightest possible check.
- **`endTime` passthrough in tradinghours vs synthesizing WEEKEND in the adapter.** Synthesis
  would give every consumer a ready-made WEEKEND transition but puts policy in a shared source
  adapter; the passthrough is pure plumbing and keeps derivation (and its tests) in the one
  consumer that needs it. Revisited easily later if a second consumer appears.
- **`endTime` passthrough vs fallback-only weekend starts.** Using the hardcoded Friday 20:00
  even when tradinghours is healthy avoids the adapter change but is wrong on holiday
  early-closes; the passthrough makes the weekend start as holiday-aware as every other session
  start.
- **No tolerance at session opens** — same reasoning as ADR-0006: warm-up placeholders are
  transmitted milliseconds before the open, so any `sessionStart − N` re-admits them.
- **Fail-closed default on indeterminate sessions, behind a flag.** Fail-open-only would
  silently disable the gate exactly when information is scarcest; unconditional fail-closed
  would remove the operational escape hatch given 24/7's previously ungated behavior. The flag
  (default true) records the intended posture while keeping it adjustable.
- **Flattened fallback vs a separate `nyse/24/7` key.** A second key duplicates the same times
  and can drift; the flattened per-market schedule is filtered by eligible statuses anyway, so
  one entry serves all callers.

## 5. Operations

### Observability (log-based, no new instrumentation)

The check ships dark, so enabling it changes nothing until the env var is set. Once enabled:

- **Rejection rate** is visible in the framework's existing HTTP request metrics (5xx per
  endpoint) — no code change needed.
- **Rejection reasons** reuse the exact 24/5 message conventions, so existing log queries carry
  over:

  ```
  |= "Market data predates session start"  # pre-session leftover (gating working)
  |= "Session start unknown"               # indeterminate session with fail-closed on
  |= "TradingHoursEA request failed"       # running on the fallback schedule
  ```

  Responses carry `gatingSessionSource: 'TRADINGHOURS' | 'FALLBACK'`, as on 24/5. Fail-open
  indeterminate serves log a distinct warning line (to be finalized in implementation) so the
  escape hatch is never silent.

### Impact on existing alerting (must be done before the flag is enabled)

- Any alert treating elevated 5xx from this EA as an outage will fire on **intended**
  rejections at session opens. Tune or annotate before rollout, not after the first page.
- Downstream "feed hasn't updated" monitors will trip when gating correctly holds the last
  onchain value during provider warm-up. That is the mitigation working — the runbook must say
  so.

### Alerts to add

- **Page:** sustained `PRE_SESSION` rejections outside expected warm-up windows; sustained
  `Session start unknown` during a trading day.
- **Never alert:** brief `PRE_SESSION` rejections confined to provider warm-up windows at
  session opens.

### How we prove the system is working

- During staging soak: session opens (including the Friday 20:00 weekend start and the Sunday
  20:00 overnight open) show either clean 200s or brief `PRE_SESSION` rejections confined to the
  warm-up window, and no onchain print whose report predates its session start.

### How we prove the system is not broken

- With the flag on and data healthy: 200-rate and onchain update cadence match the pre-flag
  baseline; rejection volume ≈ 0 outside session boundaries. The staging deploy with the flag
  **off** (step 1 of §6) is the explicit no-regression gate.

### Runbook updates

- **Our on-call:** distinguishing intended 503s from outages (reason patterns above); expected
  brief PRE_SESSION windows at every session open including the Friday weekend start; instant
  rollback = unset `ISSUER_247_SESSION_START_GATING_ENABLED` and restart.
- **NOP-facing note:** what a 503 from this endpoint means — during provider warm-up at a
  session boundary the EA intentionally rejects rather than serves a pre-session report, so the
  feed holds its last onchain value. NOPs receive this rollout with the flag **on** (§6), so
  this note travels with the release notes.

### New operational burden

- Two new env vars to track per environment. No new services, no persistence, no migrations.

## 6. Rollout & Rollback

### Phasing

1. **Staging, flag off.** Deploy with `ISSUER_247_SESSION_START_GATING_ENABLED` unset/false.
   Zero behavior change — this is the explicit no-regression check (decision matrix row 1).
2. **Staging, flag on.** Enable `ISSUER_247_SESSION_START_GATING_ENABLED` (with
   `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION` left at its default `true`). Soak
   through at least a Thursday→Monday window so the Friday weekend start and the Sunday
   overnight open are both exercised; use the `marketSessionOverride` hook (§8) for
   deterministic rejection-path verification.
3. **NOP rollout, flag on.** Roll out to NOPs with the flag enabled. The §5 NOP-facing note
   travels with the release notes.

### Rollback

Unset `ISSUER_247_SESSION_START_GATING_ENABLED` and restart — the check is fully inert when the
flag is off. No state, no migrations, no data changes. The tradinghours `endTime` passthrough is
additive and needs no rollback (existing consumers ignore it).

### One-way-door risks

None identified. The behavior change is additive and env-gated; the tradinghours change is an
additive response field; the fallback-schedule flatten is an internal refactor with 24/5
decisions unchanged.

### Release blockers

- §5 alert tuning done; tradinghours EA availability monitoring confirmed (it is the health
  signal for the fallback schedule).
- Staging no-regression deploy (flag off) and staging soak (flag on) passed with the §5 proofs.
- Product sign-off on ADR-0007 (zero tolerance and fail-closed posture extended to 24/7).

## 7. Success Metrics

**What measurable outcome improves:** onchain updates on 24/7 feeds whose underlying report
`lastSeenTimestampNs` predates its session start → **0** over the first full month post NOP
rollout.

**How we know the original problem is solved:** during the staging soak, every session boundary
(regular opens, the Friday weekend start, the Sunday overnight open) shows either clean 200s or
brief `PRE_SESSION` rejections confined to the provider warm-up window, and no accepted report
predating its session start.

**Guard metrics (must _not_ move):** 200-rate and onchain update cadence vs. the pre-flag
baseline — catches over-gating.

**Explicitly not success metrics for this rollout:** staleness on 24/7 (out of scope, §3); raw
rejection totals (a vanity metric here).

# **Supporting Details**

## 8. Interface & Data Changes

**API / request interface: unchanged for production traffic.** The response schema gains the
`gatingSessionSource` field (as on 24/5); the optional `marketSessionOverride` test hook
(already defined for 24/5, gated behind `ALLOW_MARKET_SESSION_OVERRIDE`) is honored on this
endpoint for staging verification. The only user-visible difference is _new 503 rejections with
the established messages_, and only when the new env config is enabled. The 200 path is
byte-identical with everything off.

**tradinghours `market-session` response: additive.** Each transition gains `endTime`
(alongside the existing `status` / `statusString` / `time`). Tokenized-equity is the only
consumer; existing fields are unchanged.

**No DB, schema, migration, backfill, or event changes.** No state is introduced.

**New instance-level env configuration** (all optional; everything ships dark):

| Env var                                                   | Type    | Default | Valid values   | Behavior                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ------- | ------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ISSUER_247_SESSION_START_GATING_ENABLED`                 | boolean | `false` | `true`/`false` | **This rollout.** Reject `issuer-price-247` reports whose `lastSeenTimestampNs` predates the start of the session indicated by the report's `marketStatus`. Session start from tradinghours, falling back to the flattened hard-coded schedule. |
| `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION` | boolean | `true`  | `true`/`false` | When gating is on: `true` → 503 `Session start unknown` on UNKNOWN/unmapped `marketStatus` or unresolvable session start (fail closed); `false` → serve the report with a warning log (fail open). Inert when the main flag is off.             |

**Backwards compatibility:** full. Default config = legacy behavior exactly (matrix row 1).
**Rollback of the interface change:** unset the env vars; no code revert needed.

## 9. Security

**Impact: None–Low.**

- One additive field on an existing internal dependency's response (tradinghours EA); no new
  services, credentials, secrets, or network exposure. The new env vars are non-sensitive
  operational config.
- The change only ever _rejects_ data that was previously accepted — it fails in the safe
  direction. It cannot introduce new data into responses.
- DoS surface unchanged: one shared schedule fetch per price request, bounded by the framework's
  existing rate limiter and retry/backoff.
- The hard-coded fallback schedule is static, reviewed data — no injection vector.
- No PII, no compliance or privacy surface.

**Sign-offs:** data-feeds team and PM (Gabe Silva). No Product Security / Infrastructure
Security review expected for an env-gated, reject-only change — flag if team convention says
otherwise.

## 10. Testing Plan

1. **Session-boundary correctness** — the admit/reject decision at each boundary is the whole
   feature. Unit-tested across the boundary (report exactly at the start, 1ns before, during
   warm-up) for every status in the mapping table, including PRE/POST sharing the 04:00 open.
2. **WEEKEND derivation** — weekend start computed from the last POST_MARKET `endTime` before
   the gap: normal Friday 20:00, holiday early-close (e.g. 13:00), and fallback-schedule paths;
   Friday-evening leftover served Saturday must reject, Saturday report must pass.
3. **The fallback and the flatten** — tradinghours outage → flattened hard-coded schedule with
   identical outcomes; 503 when the market has no entry; **24/5 gating decisions byte-identical
   after the flatten** (existing 24/5 session-start suites must pass unchanged).
4. **Indeterminate sessions** — UNKNOWN/unmapped `marketStatus` and unresolvable starts, with
   the fail-on-indeterminate flag both true (503) and false (200 + warning log); inert when the
   main flag is off.
5. **No regression with flags off** — matrix row 1 byte-identical; full pre-existing suite
   (including `issuer-price-247` integration tests and snapshots) runs unchanged.
6. **tradinghours passthrough** — `endTime` present and parsed; existing `market-session`
   consumers/tests unaffected.
7. **Timezone/DST handling** — session starts computed in `America/New_York`; DST transition
   weekends resolve 04:00/09:30/16:00/20:00 ET to the right UTC instants.
8. **Test hook** — `marketSessionOverride` works on `issuer-price-247` behind
   `ALLOW_MARKET_SESSION_OVERRIDE`, mirroring 24/5 semantics.
9. **Empirical validation** — the staging soak (§6) is the final check: real provider behavior
   at session opens, the Friday weekend start, and the Sunday overnight open.

## 11. Ownership

- **Owning team:** data-feeds — the team that owns the tokenized-equity EA today.
- **On-call:** unchanged — the existing EA on-call rotation; **no new pager**. The new on-call
  _content_ is the §5 runbook updates.
- **New operational responsibilities created:** keeping the flattened fallback schedule current
  if NYSE hours ever change (now including the Friday weekend start).
- **Sign-offs:** data-feeds team + PM (Gabe Silva), per §9.
- **Follow-up items (out of scope here):** staleness gating for `issuer-price-247` (§3);
  reconsidering WEEKEND synthesis in the tradinghours adapter if a second consumer ever needs
  weekend transitions.

## 12. Risks & Open Questions

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Impact                                                                                                                                                                                                                                   | Likelihood                                                                                                                        | Mitigation                                                                                                                                                                                                                               | Owner |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | **Zero tolerance at 24/7 session opens.** Every boundary (including thin sessions and the Friday weekend start) is a rejection window of provider first-post-open latency.                                                                                                                                                                                                                                                                                    | Brief 503s at every session open on 24/7 feeds                                                                                                                                                                                           | Certain at every open; window length unconfirmed for thin sessions                                                                | Product risk acceptance recorded in ADR-0007; runbook/alert tuning treats bounded windows as the mitigation working; confirm publish-vs-last-trade semantics with data-engine                                                            | TBD   |
| 2   | **Fail-closed turns previously-good responses into 503s** during tradinghours outages when the fallback cannot resolve a start — a behavior change for an endpoint that has never gated.                                                                                                                                                                                                                                                                      | 503s during schedule outages                                                                                                                                                                                                             | Low — tradinghours is monitored; the flattened fallback covers `nyse`                                                             | Deliberate, Product-accepted (ADR-0007); `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION=false` is the no-deploy escape hatch                                                                                                   | TBD   |
| 3   | **Hard-coded schedule drift**, now including the Friday weekend start. Holidays/early closes are unknown to a fixed schedule — but the weekend start is only fallback-sourced during tradinghours outages.                                                                                                                                                                                                                                                    | Wrong weekend/session starts during outages (admits or rejects the wrong reports)                                                                                                                                                        | Low                                                                                                                               | Fallback only runs during tradinghours outages; changes are reviewed code edits; tradinghours monitoring limits outage windows                                                                                                           | TBD   |
| 4   | **`lastSeenTimestampNs` semantics unconfirmed** (publish time vs. last trade) for the 24/7 stream. If last-trade-based, thin sessions could be gated longer than publish latency at every open.                                                                                                                                                                                                                                                               | Longer rejection windows at thin-session opens                                                                                                                                                                                           | Medium                                                                                                                            | Same acceptance as ADR-0006 (extended by ADR-0007); confirm with the data-engine team; revisit only if windows prove unbounded                                                                                                           | TBD   |
| 5   | **24/5 regression via the fallback flatten.** Shared configuration is being restructured under live 24/5 gating.                                                                                                                                                                                                                                                                                                                                              | Wrong 24/5 gating decisions if the flatten drops or mislabels a transition                                                                                                                                                               | Low                                                                                                                               | §10 item 3: existing 24/5 session-start test suites must pass unchanged; flatten is a pure refactor of data layout, not of gating logic                                                                                                  | TBD   |
| 6   | **Two independent sources of session truth.** The report's `marketStatus` is decided by the data-engine's static `calendar_json` runtime config (weekly template + dated exceptions, `defaultStatus`); this gate resolves that session's _start_ from the tradinghours EA (live) and the hard-coded fallback. The calendars can disagree — a holiday exception present in one but missing/stale in the other, or `calendar_json` nearing its `lastValidDate`. | Mis-gating: e.g. report says REGULAR on a day tradinghours knows is closed (gate resolves a 09:30 start that never really opened), or report says WEEKEND while tradinghours still shows an overnight phase — wrong admits or wrong 503s | Low–Medium — both calendars derive from the same venue hours but are updated by different processes (config restart vs. live API) | Reconciliation check/monitoring comparing the data-engine calendar against tradinghours (the data-engine's `lastValidDate` gauge alerts on one side); the fail-on-indeterminate flag bounds the blast radius; document in the §5 runbook | TBD   |

# **Additional Considerations**

### New Product / Service?

No — a behavior change within the existing tokenized-equity EA plus an additive field on the
existing tradinghours EA, gated by new env vars. No provisioning, upgrade, or shutdown-path
considerations beyond the standard EA release process.

### Data Model Changes?

No. No schemas, storage, migrations, or backfills.

### Customer Impact?

- **Customer communication:** yes, lightweight — release notes describe the new 503 behavior at
  session boundaries so downstream readers don't mistake intended rejections for outages.
- **GTM coordination:** none.

### NOP Impact?

- **Rollout strategy:** NOPs receive the change with `ISSUER_247_SESSION_START_GATING_ENABLED`
  **on** (§6). The §5 NOP-facing note travels with the release notes so NOPs can read
  intended-503 behavior correctly.
- **Operational changes:** none required of NOPs beyond the image/env update.
