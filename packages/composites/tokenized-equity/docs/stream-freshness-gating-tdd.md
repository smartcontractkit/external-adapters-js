# 1. Problem Statement

The Tokenized Equity EA must accommodate two aspects of the prices being produced by Data Providers:

- Invalid Pricing sent with timestamps before current market session starts (aka pre-market “warm-up” data)
- Prioritize pricing correctness over freshness when prices are older than a configured threshold

The Tokenized Equity EA that is used to create 24/5 data feeds (DF1) performs no check on when a price was actually produced by the data provider. It consumes whatever report the stream delivers, so stale or pre-session data can reach the chain with nothing in the pipeline positioned to reject it. Streams documentation describes these failure modes and provides [mitigation instructions](https://docs.chain.link/data-streams/rwa-streams/24-5-us-equities-user-guide#mitigation-3) on how to handle stale prices, mitigations our own feeds do not currently implement. This has produced two recurring production failure modes with the same root cause:

**Stale prices**. Feeds have printed prices whose `lastSeenTimestampNs` was hours old, causing onchain moves of 1-4% that reverted once fresh data resumed. This has occurred repeatedly in production, including multi-feed, multi-chain events on the overnight session.

**Pre-open warm-up data**. Providers warm up the regular-session endpoint before the open and transmit invalid placeholder prices on it. These carry fresh timestamps (updated milliseconds before the open), so a freshness bound alone cannot catch them. The provider only guarantees validity for updates timestamped after the open, and the first valid update can arrive ~40-50 seconds in. Observed in production incidents at session opens on a tokenized-equity feed, with a consistent symptom: a report with a `lastSeenTimestampNs` just before the regular-session open, producing a sharp spurious move at the open that corrects within a minute.

## 2. Goals

**Customer outcomes**

- No onchain price moves caused by stale reports: a report older than the configured freshness
  threshold is rejected (503) instead of published, so feeds retain their last valid value
  through provider outages rather than printing stale data.
- No spurious moves at session opens: reports timestamped before the current session's start are
  discarded, even when they are fresh by age (the warm-up failure mode a freshness bound cannot
  catch).

**Engineering/operational outcomes**

- Freshness and session-start policy enforced in one place — the tokenized-equity EA's stream
  selection — configured per instance via env vars, with no request-parameter or feed-config
  changes required to adopt.
- Both checks ship dark (disabled by default) and are independently tunable per session
  (regular / extended / overnight).
- Stream-selection semantics unchanged: the pre-existing eligibility fall-through
  (regular → extended → overnight by `marketStatus`) is preserved; the new checks gate the
  selected stream and deliberately do **not** fail over to a different session's stream, which
  would silently change the pricing source.
- Rejection reasons are observable without new instrumentation: every rejection carries a
  distinct message prefix in the EA's structured logs (`Market data is stale`, `Market data
predates session start`, `Market is not open`), enabling log-based
  dashboards and alerts per reason, built on the EA's log pipeline.

**Measurable improvements**

- Zero stale-price incidents attributable to report age after rollout.
- Zero pre-open warm-up incidents at session opens **on gated feeds**. The 5 `smoother: 'none'` feeds
  skip the check (§4) and are excluded from this target until their follow-up coverage lands (§6).
- Rejection rate per reason queryable from logs, so intended rejections (gating working) are
  distinguishable from provider degradation (UNKNOWN status, fetch failures).

## 3. Non-Goals

- **No changes to data providers or data-engine.** Gating is consumer-side, in the
  tokenized-equity EA only. Fixing provider warm-up behavior or upstream staleness at the source
  is out of scope.
- **No new _required_ request parameters on the EA.** All configuration is via instance-level env
  vars. Shipped exception: one new _optional_ request parameter, `marketSessionOverride` (a
  test/staging hook for the session-start check, §4). Requests that omit it are accepted
  unchanged, so the spirit of this goal — no new request burden on existing feed configs — is
  preserved.
- **No per-feed thresholds.** Thresholds are per session type (regular / extended / overnight),
  applied instance-wide. Per-feed tuning is explicitly not a goal.
- **No multi-chain / NOP-specific tuning.** Rollout to and tuning across NOPs and chains is out
  of scope for this change.
- **No fail-over to alternate session streams.** A selected stream that fails a freshness or
  session-start check is rejected (503); it is never substituted with a report from a different
  session's stream.
- **No new metrics/telemetry instrumentation.** Observability is log-based (existing structured
  logs + existing framework HTTP status-code metrics). Reason-labeled Prometheus metrics would
  require EA framework changes and are a possible follow-up, not part of this work.
- **No local caching of the tradinghours schedule.** On a tradinghours outage the EA degrades
  through the fallback (the hard-coded labeled schedule, `nyse/24/5`; the smoother separately
  keeps its `sessionBoundaries` fallback) rather than serving a cached copy or failing closed. A
  proper fallback cache is follow-up work, tracked separately.
- **No default enablement.** Both checks ship dark and stay opt-in; nothing changes for feeds
  until env vars are set. Furthermore, _enabling_ the staleness check is out of scope for this
  rollout entirely (§6): its thresholds are tuned in a follow-on effort; only session-start
  gating is enabled here.

**Accepted tradeoff:** rejection (503) is the mitigation mechanism. During provider degradation,
feeds hold their last onchain value longer rather than printing bad data — correctness is
deliberately prioritized over freshness.

# **Technical Details**

## 4. Proposed Design

### Overview

Both checks are enforced at a single point: stream selection in the tokenized-equity EA
(`lib/streams.ts getStream()`), through which every price request across all endpoints and
transports already flows. Evaluation order is fixed — **select → session-start check → staleness check** —
the first check that fails causes the rejection (503). Session-start runs first because a pre-session
leftover is invalid _regardless of age_; staleness is only meaningful for in-session reports.

Stream selection itself is unchanged: the pre-existing eligibility fall-through (priority order
regular → extended → overnight, a stream eligible only when its report's `marketStatus` matches
the session it serves) is preserved exactly. The new checks gate the _selected_ stream only.

### Design constraints

- **Provider validity contract.** The provider guarantees validity only for updates timestamped
  after the session open; warm-up placeholders transmitted before the open carry _fresh_
  timestamps (updated milliseconds before the open), and the first valid update can arrive
  ~40–50 seconds in. Consequence: an age-based freshness bound alone cannot catch the warm-up
  failure mode — a session-boundary check is required.
- **`lastSeenTimestampNs` semantics.** The gate treats `lastSeenTimestampNs` as the
  provider-side timestamp of the report's latest observation and rejects whenever it predates
  the session start — with **no pre-open tolerance**. Consequence: every session open is a
  rejection window whose length is the provider's first-post-open observation latency
  (~40–50s stated for the regular session; no bound is yet established for the thinner
  pre-market and overnight sessions). If the field proves to be last-trade-based rather than
  publish-based, a thin session could be gated for longer than its publish latency. That
  exposure is **accepted deliberately**: correctness is prioritized over availability at
  session opens, so no `sessionStart − N` tolerance is applied. Open: confirm
  publish-vs-last-trade semantics per session type with the data-engine team (§12).
- **Consumer-side only.** No changes to data providers or data-engine; nothing upstream changes.
- **No new _required_ request parameters.** All configuration is instance-level env vars.
  (Shipped exception: the optional `marketSessionOverride` test/staging hook — §3.)
- **Clock precision.** Report age is computed as `now − lastSeenTimestampNs` against the local
  clock. Thresholds are seconds and orders of magnitude larger than any NTP skew, so no special
  clock-synchronization precision is needed.

### Check 1: pre-open warm-up (session-start) gating

Enabled by `SESSION_START_GATING_ENABLED`. **Applies only to requests that carry
`sessionMarket`/`sessionMarketType`; requests without both params skip this check entirely** (see
below — the 5 `smoother: 'none'` feeds' steady state). The session start is computed from the
tradinghours `market-session` schedule as the latest transition at or before now whose status opens
the selected stream's session. The **unfiltered** schedule is used — the smoother's timing path
deliberately drops REGULAR transitions (smoothing only reacts to thin-liquidity session
boundaries) and Sunday OVERNIGHT transitions (stale weekend data must not feed smoothing). Both
dropped transitions are mandatory for gating: without REGULAR the regular stream would find no
opening transition and could never gate the regular open; without Sunday OVERNIGHT the Sunday
open could not be distinguished from Friday leftovers. A single fetch per price request is shared
by both consumers.

A selected report whose `lastSeenTimestampNs` predates the current session start is a leftover
from the previous session and is rejected with 503 `Market data predates session start: …
PRE_SESSION(...)`, even if it is fresh by age. This catches what the age check cannot: a report
produced just before a boundary but served just after it (the 15:59:59 REGULAR print echoed into
POST_MARKET; Friday overnight data served at the Sunday open). This check runs **before** the
staleness check: a pre-session leftover is invalid regardless of its age.

### Check 2: staleness gating

A selected, in-session report whose age exceeds the configured threshold for its session
(`DS_VALID_MAX_AGE_SECONDS`, with `_REGULAR` / `_EXTENDED` / `_OVERNIGHT` overrides) is rejected
with 503 `Market data is stale: … STALE(status, age=Xs>Ys)`. This catches mid-session freezes: a
stream that stops updating while the market is open. A stale selected stream is rejected.

### New dependency: tradinghours EA market-session schedule

The only new runtime dependency, and only when `SESSION_START_GATING_ENABLED=true` (a
`smoother: 'none'` feed carrying market identity makes no tradinghours call while the flag is
off — the fetch is skipped when neither the gate nor the smoother consumes the schedule).
There is
deliberately **no local caching** of the fetched schedule. When the tradinghours schedule is
unusable — the fetch fails, **or the response cannot be used to determine the current session's
start** (e.g. no transition opening the selected session) — gating falls back to a **hard-coded
labeled schedule in the EA** rather than rejecting. Gating deliberately does **not** use the
per-feed `sessionBoundaries` parameter: its times are unlabeled, so it cannot say which session
a boundary opens, and the conventional values (`04:00` / `16:00` / `20:00` ET) lack the 09:30
regular open — gating on it would silently weaken exactly the regular-open protection this
feature exists for. (`sessionBoundaries` remains the _smoother's_ fallback, unchanged.)

1. **tradinghours `market-session`** — authoritative, labeled per session, holiday/early-close
   aware. The only source used in normal operation.
2. **Hard-coded labeled schedule in the EA** — the fallback. Keyed by market/type and initially
   defined **only for `nyse` + `24/5`** — the sole market with a dedicated 24/5 schedule in
   tradinghours today, and the only combination TE feeds use:

   ```ts
   // Hard-coded fallback schedules, keyed by market/type we actually serve.
   // Labeled session opens in the venue's local time; evaluated with the same TZDate
   // handling as sessionBoundaries. Mirrors the nyse/24/5 structure from tradinghours:
   // overnight sessions open 20:00 Sun–Thu (running to 04:00); Friday 20:00 → weekend.
   const FALLBACK_SESSION_SCHEDULE = {
     'nyse/24/5': {
       timezone: 'America/New_York',
       // Keyed by Date.getDay() (0 = Sunday … 6 = Saturday): lookup is
       // weeklyOpens[zonedNow.getDay()]. Keys are explicit so each line asserts its
       // own day — a positional list would be silently reorderable.
       weeklyOpens: {
         0: [{ at: '20:00', opens: 'OVERNIGHT' }], // Sunday
         1: [
           { at: '04:00', opens: 'PRE_MARKET' },
           { at: '09:30', opens: 'REGULAR' },
           { at: '16:00', opens: 'POST_MARKET' },
           { at: '20:00', opens: 'OVERNIGHT' },
         ],
         2: [
           /* same as Monday */
         ],
         3: [
           /* same as Monday */
         ],
         4: [
           /* same as Monday */
         ],
         5: [
           { at: '04:00', opens: 'PRE_MARKET' },
           { at: '09:30', opens: 'REGULAR' },
           { at: '16:00', opens: 'POST_MARKET' },
         ], // Friday: no 20:00 overnight open
         6: [], // Saturday
       },
     },
   }
   ```

   Because it is labeled, the fallback keeps **full gating precision**: the true 09:30 regular
   open, and the **Sunday 20:00 overnight open** (which the smoother's fallback generator
   deliberately skips) — so the Friday-leftovers-at-Sunday-open case stays gated even during a
   tradinghours outage. Market/type pairs without a hard-coded entry get **no fallback**: with
   gating enabled and tradinghours unusable, the request 503s — loud rather than silently wrong.
   Adding a market later is one reviewed map entry.

Protection therefore degrades to a fixed schedule rather than disappearing across an outage, and
feeds stay available instead of 503ing — with one bounded exposure: hard-coded schedule drift
(baked-in NYSE hours can go stale on venue changes, and holidays/early closes are unknown to a
fixed schedule; mitigated by the fallback running only when tradinghours is down, and by the
release process for any change).

**Fallback activation telemetry.** There is no metric distinguishing a tradinghours-sourced
from a fallback-sourced decision (log-based observability only, §3), but the gate's fallback
activation is visible on both paths: (1) when the tradinghours fetch **fails**, the
per-request error line (`TradingHoursEA request failed; …`) is logged; (2) when the fetch
**succeeds but the schedule has no transition opening the selected session**, the gate logs a
distinct line (`Session-start gating: fetched tradinghours schedule has no transition opening
the selected session; using the hard-coded fallback schedule …`) — without it this path would
be silent. On both paths the response carries `gatingSessionSource: 'FALLBACK'` (distinct from
`sessionSource`, which reflects the smoother's source). The primary health signal for this
dependency remains **monitoring of the tradinghours EA itself** — its own availability/5xx
alerts are what tell us the TE EA is gating on the fallback schedule.

Gating identifies the market from the request's `sessionMarket` / `sessionMarketType` params —
and **never** reads `sessionBoundaries` or `sessionBoundariesTimeZone` (those are the smoother's
fallback inputs alone). The timezone that the tier-1 `market-session` call requires, and that the
fallback schedule is evaluated in, comes from the hard-coded map entry for the market/type —
one entry is the single source of per-market truth (`nyse/24/5` → `America/New_York`).

Note this changes the `timezone` sent on the tradinghours request for feeds that carry market
identity: previously the request's `sessionBoundariesTimeZone`, now the map entry's timezone.
Tradinghours uses that value to compute its `[now-1d, now+1d]` query window, so for a feed
whose `sessionBoundariesTimeZone` differed from the map entry the window could shift by up to a
day. Immaterial today — the only market served is `nyse/24/5`, where both are
`America/New_York` — and deliberate: gating deliberately does not trust the per-feed smoother
params, so the venue's true timezone must come from the reviewed map entry.

**Requests without `sessionMarket`/`sessionMarketType` skip the session-start check entirely.**
When either param is absent — as on the 5 `smoother: 'none'` feeds, whose requests carry no
session params today — there is no market identity to gate against, so the check is a
pass-through even when `SESSION_START_GATING_ENABLED=true`: no tradinghours fetch is made,
no fallback is consulted, and the request proceeds to the staleness check (if enabled) exactly as
if gating were disabled. This keeps the `none` feeds serving with zero config changes — no
validation relaxation and no RDD changes are required — at the cost of those feeds remaining
**uncovered** by warm-up protection until market identity is added to their configs (a necessary
follow-up; the params-only change would be inert to pricing). The skip is per-request, so
requests that do carry the params on the same instance are still gated.

### State changes

None. No persistence, no caches, no stored state; the schedule is fetched fresh and every request
is evaluated independently.

### Failure behavior: decision matrix

One row per outcome of a request through `getStream()`. Evaluation order is fixed: **select →
session-start → staleness**. The first check that fails produces the 503; later checks are not
reached (e.g. a report that is both pre-session and stale reports `PRE_SESSION`). The
session-start check only runs when the request carries `sessionMarket`/`sessionMarketType`;
without them it is skipped (row 7a).

Criteria columns:

- **marketStatus match** — does any stream's report carry a `marketStatus` in its eligible set
  (regular: REGULAR; extended: PRE_MARKET/POST_MARKET; overnight: OVERNIGHT)? Streams are tried
  in priority order regular → extended → overnight.
- **staleness check / age** — is a threshold configured for the selected stream
  (`DS_VALID_MAX_AGE_SECONDS*`), and how does the report age compare?
- **session-start gating** — `SESSION_START_GATING_ENABLED`.
- **schedule** — is the tradinghours `market-session` schedule available, and does it contain a
  transition opening the selected session?
- **lastSeen vs start** — report timestamp vs the current session's start.

| #   | marketStatus match                                                 | staleness check                                   | age         | session-start gating                               | schedule                                                       | lastSeen vs start         | Outcome                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------ | ------------------------------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅ stream selected                                                 | off                                               | —           | off                                                | —                                                              | —                         | **200** pass-through (legacy behavior; both checks inert)                                                                                                                                                                                                                               |
| 2   | ✅                                                                 | on                                                | ≤ threshold | off                                                | —                                                              | —                         | **200** (valid price, not stale)                                                                                                                                                                                                                                                        |
| 3   | ✅                                                                 | on                                                | > threshold | off, or on + in-session                            | —, or ✅ + transition found                                    | —, or ≥ start (gating on) | **503** `Market data is stale: … STALE(status, age=Xs>Ys)` — mid-session freeze; no fail-over to another session's stream                                                                                                                                                               |
| 4   | ✅                                                                 | off, or not stale                                 | —           | on                                                 | ✅ + transition found                                          | ≥ session start           | **200** (valid price, not stale, not before session start)                                                                                                                                                                                                                              |
| 5   | ✅                                                                 | any (never evaluated — session-start fails first) | any         | on                                                 | ✅ + transition found                                          | < session start           | **503** `Market data predates session start: … PRE_SESSION(...)` — pre-open leftover, even if fresh by age                                                                                                                                                                              |
| 6   | ✅                                                                 | off, or not stale                                 | —           | on                                                 | ❌ tradinghours errored/unreachable                            | vs **fallback** start     | fall back to the hard-coded labeled schedule (`nyse/24/5` only). Rows 4/5 apply against the fallback start. **503** only if the market/type has no hard-coded entry.                                                                                                                    |
| 7   | ✅                                                                 | off, or not stale                                 | —           | on                                                 | ✅ have schedule, but no transition opens the selected session | vs **fallback** start     | same fallback as row 6 — a tradinghours schedule that cannot determine the current session start is treated identically to a failed fetch                                                                                                                                               |
| 7a  | ✅                                                                 | (evaluated if on)                                 | any         | on, but `sessionMarket`/`sessionMarketType` absent | — (no fetch made)                                              | —                         | **session-start check skipped** — pass-through to the staleness check (rows 2–3), exactly as if gating were disabled. No tradinghours fetch, no fallback. This is the steady state of the 5 `smoother: 'none'` feeds (§4) — they are reachable but **uncovered** by warm-up protection. |
| 8   | ❌ all streams UNKNOWN(0)                                          | any                                               | any         | any                                                | any                                                            | any                       | **503** `Market is not open: regular UNKNOWN, …` — provider degraded; alert-worthy (distinct from row 9)                                                                                                                                                                                |
| 9   | ❌ WEEKEND(5), or closed-market phases with no eligible stream     | any                                               | any         | any                                                | any                                                            | any                       | **503** `Market is not open: …` — expected; never alert                                                                                                                                                                                                                                 |
| 10  | ❌ stream fetch failed (data-engine error for the eligible stream) | any                                               | any         | any                                                | any                                                            | any                       | **503** `Market is not open: <name>  <error>` — upstream fetch error surfaced in the message                                                                                                                                                                                            |
| 11  | mixed: e.g. regular=UNKNOWN, extended=POST_MARKET                  | —                                                 | —           | —                                                  | —                                                              | —                         | selection proceeds on the matching stream (extended); rows 1–7 then apply to it                                                                                                                                                                                                         |

Notes:

- Rows 3–5 are the feature; row 1 is the ship-dark default (all checks off).
- Rows 6–7 degrade rather than reject: on a tradinghours outage (or a schedule that can't place
  the current session) gating falls back to the hard-coded labeled schedule. A 503 only results
  if the report also fails against the fallback start, or no fallback exists for the feed's
  market/type. Row 7a is the skip path: requests without `sessionMarket`/`sessionMarketType`
  (e.g. the 5 `smoother: 'none'` feeds) bypass the session-start check entirely — no fetch, no
  fallback, no rejection from this check — so they need no config changes and get no warm-up
  protection. Note gating needs only `sessionMarket`/`sessionMarketType` (the timezone comes
  from the hard-coded map entry); `sessionBoundaries`/`sessionBoundariesTimeZone` are the
  smoother's fallback inputs and their absence does not affect gating.
- In rows 8–10 the rejection reason is not visible in the status code alone — reason-level
  observability is log-based (see §5 Operations).
- A stream frozen _between_ sessions (e.g. overnight stream still showing Friday 04:00 ET during
  REGULAR) is not an error: its `marketStatus` echoes the market phase, so it is simply not
  selected (rows 8–11 apply only when no stream matches).

### Why this design / alternatives rejected

- **Session-start before staleness.** A pre-session leftover is invalid _regardless of age_ —
  its freshness is precisely what makes it dangerous. Running the boundary check first means a
  report that is both pre-session and stale reports `PRE_SESSION`, and staleness only ever
  evaluates reports that provably belong to the current session.
- **Consumer-side gating vs fixing providers/upstream.** Provider warm-up behavior and upstream
  staleness are outside our control and timeline; the EA is the last point where bad data can be
  stopped before it reaches the chain, and it already sees every stream plus the session
  schedule.
- **Hard-coded fallback vs failing open or closed when the tradinghours schedule is unusable.**
  Failing open would silently disable the warm-up check exactly when schedule uncertainty is
  highest; failing closed would 503 fresh in-session data for the duration of any tradinghours
  outage. Falling back to the hard-coded labeled schedule keeps feeds available at full gating
  precision for the market/types we serve. Gating deliberately skips the per-feed
  `sessionBoundaries` fallback the smoother uses: those times are unlabeled (a boundary can't be
  attributed to a session) and conventionally lack the 09:30 regular open, so gating on them
  would silently weaken the regular-open protection that is this feature's core case. This
  supersedes the earlier "mirror the smoother" fallback decision; PM sign-off tracked in §12.
- **No fail-over across session types.** A different session's stream reports a price from a
  different liquidity regime; substituting it would silently change the pricing source. Selection
  already falls through on _eligibility_ (status mismatch or fetch failure) — quality gates only
  ever apply to the stream that legitimately owns the current session, and typically only one
  stream is eligible at any moment.
- **Instance-level env vars vs request parameters.** Freshness policy is an operational property
  of the deployment, not a per-request choice; env vars make adoption a config change with no
  feed-config or requester changes, and keep the EA's public interface unchanged.
- **Per-session thresholds vs a single global threshold.** Overnight cadence is much slower than
  regular hours; one threshold cannot fit all sessions. Per-session overrides with a shared
  default keep the common case to one env var.

## 5. Operations

### Observability (log-based, no new instrumentation)

Both checks ship dark, so enabling them changes nothing until env vars are set. Once enabled:

- **Rejection rate** is visible in the framework's existing HTTP request metrics (5xx per
  endpoint) — no code change needed.
- **Rejection reason** is carried in the 503 message, which lands in the EA's structured logs
  and downstream in node-side error logs. Reason-level dashboards/alerts are log queries
  (log-query patterns; label selectors omitted — adapt to the pipeline):

  ```
  # intended rejections (gating working)
  |= "Market data is stale"              # row 3: mid-session freeze
  |= "Market data predates session start" # row 5: pre-open leftover
  # selection failures (pre-existing behavior, now worth distinguishing)
  |= "Market is not open" |= "UNKNOWN"   # row 8: provider degraded — alert-worthy
  |= "Market is not open" |= "WEEKEND"   # row 9: expected — never alert
  # fail-closed when no schedule can place the session
  |= "Session start unknown"             # expected when the market is closed (weekend/holiday: no
                                         # past transition exists for any session) — never alert then;
                                         # investigate if seen during a trading day
  # fallback activation (tradinghours outage)
  |= "TradingHoursEA request failed"     # rows 6–7: running on fallback schedule
  |= "no transition opening the selected session" # row 7 without a fetch error: fetched schedule
                                                  # incomplete, gate on the fallback
  ```

  Example panel: `sum by (reason) (count_over_time({…} |= "<prefix>" [$__range]))` per pattern
  above. The tradinghours lines also drive a fallback-mode indicator — their presence _is_ the
  signal that the fallback schedule is active (alongside the `gatingSessionSource: 'FALLBACK'`
  response field; see §4). Tradinghours EA availability monitoring remains the primary health
  signal for that dependency.

### Impact on existing alerting (must be done before the flags are enabled)

- Any alert treating elevated 5xx from this EA as an outage will fire on **intended**
  rejections. These alerts need to be tuned (exclude or threshold the gating reasons) or
  annotated before rollout, not after the first page.
- Downstream "feed hasn't updated" / staleness monitors will trip when gating correctly holds
  the last onchain value during provider degradation. That is the mitigation working, not a new
  incident — the runbook entry (below) must say so.

### Alerts to add

- **Page:** sustained `UNKNOWN` rejections during what should be an active session (row 8 —
  provider degraded); suggested threshold ~10m. Sustained `STALE` / `PRE_SESSION` rejections
  outside expected warm-up windows likewise indicate a provider incident.
- **Page:** `TradingHoursEA request failed` persisting — the TE EA is gating on the hard-coded fallback schedule;
  pair with tradinghours EA's own availability alerts.
- **Never alert:** WEEKEND / legitimately-closed rejections (row 9); `Session start unknown`
  when the market is closed (weekends/holidays — the schedule genuinely has no past transition
  for any session). `Session start unknown` during a trading day **is** actionable (schedule
  outage plus a fallback gap, or a market/type with no fallback entry).

### How we prove the system is working

- Log queries show rejections correlating with known provider events (stream freezes, session
  opens), and — the real proof — **no spurious onchain moves** on the gated feeds during those
  windows (compare onchain updates against the pre-rollout incident pattern).

### How we prove the system is not broken

- With flags on and the market healthy: 200-rate and onchain update cadence match the pre-flag
  baseline; rejection volume ≈ 0 outside session boundaries; first requests after each open
  succeed once valid data arrives (~40–50s in).
- Canary one instance first and diff its rejection/200 mix against ungated instances.

### Runbook updates

- **Our on-call:** how to distinguish intended 503s from an outage (query the reason patterns
  above); expected behavior at session opens (brief PRE_SESSION rejections possible until the
  first valid provider update, ~40–50s); instant rollback = unset the env vars and restart —
  both checks are inert when unset.
- **NOP-facing note:** what a 503 from this EA means for NOPs running it — during provider
  degradation the EA intentionally rejects rather than serves stale/pre-session data, so the
  feed holds its last onchain value; a sustained 503 with `Market data is stale` /
  `predates session start` is provider-side, not an EA bug; `TradingHoursEA` errors mean the
  hard-coded fallback schedule is active. (Advisory only — NOP rollout/tuning is out of scope, §3.)

### New operational burden

- Per-session threshold tuning (`DS_VALID_MAX_AGE_SECONDS*`), especially overnight cadence.
- One new config surface (the env family) to track per environment.
- No new services, no persistence, no migrations.

## 6. Rollout & Rollback

### Scope (RDD census)

Rollout scope from the reference-data-directory census: **119 tokenized-equity feeds** (35
robinhood, 27 default-endpoint, 26 coinbase, 19 xstocks, 12 ondo), all on the identical config
`sessionBoundaries: ["04:00","16:00","20:00"]`, `America/New_York`, `nyse` / `24/5`, default
kalman smoother — plus **5 outlier feeds (4 ondo + 1) on `smoother: 'none'`** with no session
params at all. No feed config changes are required for adoption.

### Phasing

Session-start gating rolls out **first and alone**. The staleness check ships dark in the same
release but its thresholds are not yet tuned — enabling it is a separate follow-on effort
(threshold values will come from staged-traffic cadence analysis, and are not a prerequisite for
gating).

1. **Ship dark.** Deploy with `SESSION_START_GATING_ENABLED` unset/false and all
   `DS_VALID_MAX_AGE_SECONDS*` unset. Zero behavior change (matrix row 1).
2. **Pre-enablement blockers.** (a) ~~Make the 5 `smoother: 'none'` feeds gateable~~ **No longer
   required.** Requests without `sessionMarket`/`sessionMarketType` skip the session-start check
   (§4, matrix row 7a), so the 5 `none` feeds pass through unchanged with the flag on — no
   validation relaxation, no RDD config changes, no smoother change. The tradeoff: those feeds
   remain **uncovered** by warm-up protection. The 5 feeds (all `mainnet`, from the RDD census):

   | Feed                      | Endpoint  |
   | ------------------------- | --------- |
   | FLHYon / USD (Calculated) | ondo      |
   | FLHYon-USD (Calculated)   | ondo      |
   | USFRon-USD (Calculated)   | ondo      |
   | STRCon-USD (Calculated)   | ondo      |
   | SPCX / USD                | (default) |

   Note: under the skip design these feeds
   stay unprotected at rollout; closing that gap is a deliberate follow-up — add
   `sessionMarket`/`sessionMarketType` to their RDD configs once the gated feeds have soaked.
   (The accompanying `validateSmoother` relaxation — permitting market identity with
   `smoother: 'none'`, inert to pricing — already shipped in this PR, so only the RDD config
   changes remain.)
   (b) Complete the alert tuning
   from §5 (5xx alerts annotated/tuned for intended rejections; UNKNOWN/STALE/PRE_SESSION log
   alerts in place). (c) Confirm tradinghours EA availability monitoring exists — it is the
   health signal for the fallback schedule.

3. **Staging soak.** Enable `SESSION_START_GATING_ENABLED` on staging for at least a
   **Thursday-through-Monday** window: one normal day, the weekend, one normal day. This covers
   Friday's pre-market and regular opens, Monday's opens, and the Sunday 20:00 overnight open —
   the Friday-leftovers-at-Sunday-open case — with at least two regular-session opens observed.
   Success = §5 proofs: no spurious moves at opens, PRE_SESSION rejections only in the warm-up
   window, 200-rate otherwise unchanged.
4. **Prod canary.** Enable on one EA instance; diff its 200/rejection mix against ungated
   instances through at least one session open.
5. **Prod-wide.** Enable on all instances.

### Rollback

Unset `SESSION_START_GATING_ENABLED` and restart (or per-instance equivalent) — the check is
fully inert when the flag is off. No state, no migrations, no data changes. No feed-config
changes were made for this rollout, so there is nothing to revert.

### One-way-door risks

None identified. The change is additive and env-gated; there are no persistent artifacts. The
public interface gained two strictly additive relaxations: one new optional request parameter
(`marketSessionOverride`, §3) and a `validateSmoother` change permitting
`sessionMarket`/`sessionMarketType` with `smoother: 'none'` (previously rejected with 400).
Neither rejects any previously accepted request; requests without session params are still
accepted and skip the check.

### Release blockers

- ~~5 `none`-smoother feeds gateable~~ **Removed:** requests without
  `sessionMarket`/`sessionMarketType` skip the check (row 7a), so the 5 `none` feeds need no
  changes. (Covering them is a follow-up, §6 step 2a.)
- §5 alert tuning done (2b); tradinghours EA monitoring confirmed (2c).
- Staging soak passed with the §5 proofs.

### NOP impact

Out of scope (§3). The NOP-facing runbook note from §5 travels with the release notes so NOPs
can read intended-503 behavior correctly if they encounter it.

## 7. Success Metrics

**What measurable outcome improves:** spurious onchain moves at session opens, caused by pre-open
warm-up reports, go to zero **on gated feeds**. Note that the feeds where this failure mode has
been observed are `smoother: 'none'` and therefore **skip the check** at this rollout; their
coverage is the §6 follow-up. Target: **0
over the first full month post prod rollout** on the 119 gated feeds (a clean month is a
meaningful signal given historical cadence).

**How we know the original problem is solved:** during the staging soak and prod canary, every
session open shows either clean 200s or brief `PRE_SESSION` rejections confined to the provider
warm-up window (~40–50s after the open), and no onchain print whose report predates the session
start. Counterfactual proof while canarying: if a provider transmits warm-up placeholders during
the canary window, the gated instance rejects while ungated instances print the spurious move —
a direct before/after on the same feeds at the same moment.

**What metric moves:**

- Onchain updates whose underlying report `lastSeenTimestampNs` predates the session start: → 0.
- `PRE_SESSION` rejections per session open (log-derived): expected small and decaying to zero
  within ~1 minute of the open; a persistent tail means the provider contract or our session-start
  source is wrong.
- Guard metrics (must _not_ move): 200-rate and onchain update cadence vs. the pre-flag baseline —
  catches over-gating.

**Explicitly not success metrics for this rollout:** the stale-price incident count (the staleness
check ships dark; its baseline and target belong to the follow-on enablement effort) and raw
rejection totals (a vanity metric here — rejections rising is only bad if the guard metrics move).

# **Supporting Details**

## 8. Interface & Data Changes

**API / request interface: unchanged for production traffic.** The response schema is
unchanged; one optional request parameter (`marketSessionOverride`, a staging test hook — see
below) is added. The only user-visible difference is _new 503 rejections with distinct messages_, and
only when the new env config is enabled. The 200 path is byte-identical with everything off.

**No DB, schema, migration, backfill, or event changes.** No state is introduced.

**New instance-level env configuration** (all optional; everything ships dark):

| Env var                              | Type       | Default              | Valid values                     | Behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | ---------- | -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ALLOW_MARKET_SESSION_OVERRIDE`      | boolean    | `false`              | `true`/`false`                   | Opt-in switch for the `marketSessionOverride` test hook (§3): requests carrying the parameter are rejected with 400 unless this is `true` (any other string, or unset, rejects). Staging-only; leave unset in production.                                                                                                                                                                                                                                                                                                                                                                              |
| `SESSION_START_GATING_ENABLED`       | boolean    | `false`              | `true`/`false`                   | **This rollout.** Pre-open warm-up check: a selected report whose `lastSeenTimestampNs` predates the current session start is rejected with 503 `PRE_SESSION(...)`. Session start comes from tradinghours, falling back to the hard-coded labeled schedule (`nyse/24/5`) when tradinghours is down or its schedule unusable; 503 only when no schedule can supply a start. Uses the request's `sessionMarket`/`sessionMarketType` (never `sessionBoundaries`/`sessionBoundariesTimeZone`); requests without them — e.g. the 5 `smoother: 'none'` feeds — **skip this check entirely** (matrix row 7a). |
| `DS_VALID_MAX_AGE_SECONDS`           | number (s) | unset (off)          | positive int; unset/`0` disables | Shared staleness threshold for all streams; older reports rejected with 503 `STALE(...)`. Also the threshold for the 24/7 `issuer-price-247` stream, which has no sessions (ADR-0003); the per-session overrides do not apply there. **Ships dark — enabled in a follow-on effort.**                                                                                                                                                                                                                                                                                                                   |
| `DS_VALID_MAX_AGE_SECONDS_REGULAR`   | number (s) | falls back to shared | positive int                     | Per-session override, regular-hours stream.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `DS_VALID_MAX_AGE_SECONDS_EXTENDED`  | number (s) | falls back to shared | positive int                     | Per-session override, extended-hours stream.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `DS_VALID_MAX_AGE_SECONDS_OVERNIGHT` | number (s) | falls back to shared | positive int                     | Per-session override, overnight stream (expected looser — slower cadence).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Override resolution per stream: `_<SESSION>` wins if set and > 0, else the shared value, else the
check is off for that stream. Overrides are independent.

**Backwards compatibility:** full. Default config = legacy behavior exactly (decision matrix row
1). **Rollback of the interface change:** unset the env vars; no code revert needed.

### Test hook: `marketSessionOverride` request parameter

To demonstrate the warm-up filter deterministically in staging (the real condition — a report
timestamped before the session start — occurs only intermittently), the shared input definition
accepts an optional `marketSessionOverride` parameter (any `TwentyfourFiveMarketStatus` value:
`UNKNOWN`, `PRE_MARKET`, `REGULAR`, `POST_MARKET`, `OVERNIGHT`, `WEEKEND`).

When present, the session-start gating check resolves the **next start of the named session**
(first tradinghours transition strictly after now) instead of the current session's start, and
the real comparison runs unchanged — any live report predates a future start, so the request is
rejected with the genuine 503 `Market data predates session start: ... PRE_SESSION(...)` path.
Scope and semantics:

- **Gating check only.** Stream selection, smoother transition filtering, overnight warm-up, and
  the staleness check are unaffected.
- **Tradinghours schedule only.** The hard-coded fallback schedule is never consulted for the
  override; if tradinghours has no future transition for the named session the check fails
  closed with 503 `Session start unknown`.
- **Validation.** 400 `AdapterInputError` if `marketSessionOverride` is present without both
  `sessionMarket` and `sessionMarketType` (gating is skipped without market identity, so the
  override would otherwise be silently ignored).
- **Observability.** Override-forced rejections append `[marketSessionOverride=<STATUS>]` to the
  503 message and the `PRE_SESSION(...)` description, so they are unmistakable in logs.
- **Explicit rejection unless opted in** — the parameter requires
  `ALLOW_MARKET_SESSION_OVERRIDE=true`; a request carrying it with the var unset (or set to any
  other string) is rejected with 400 rather than silently ignored. Even when allowed, it also
  requires `SESSION_START_GATING_ENABLED=true`, since the hook only affects that check. Only the
  four real session statuses are accepted
  (`PRE_MARKET | REGULAR | POST_MARKET | OVERNIGHT`; `UNKNOWN`/`WEEKEND` can never match a
  tradinghours transition and are rejected with 400 by input validation). Requests carrying it
  get their own subscription/cache entry (dedupe key includes it), so they cannot poison prices
  for non-override subscribers of the same feed.

## 9. Security

**Impact: None–Low.**

- No new external services: the only new call is to the tradinghours EA, an existing internal
  dependency already used by the smoother path. No new credentials, secrets, or network exposure;
  the new env vars are non-sensitive operational config.
- The change only ever _rejects_ data that was previously accepted — it fails in the safe
  direction. It cannot introduce new data into responses.
- Denial-of-service (DoS) surface unchanged: the schedule lookup is one shared upstream fetch per
  price request, bounded by the framework's existing rate limiter and retry/backoff — a
  tradinghours outage adds bounded latency to failing requests, not a resource-amplification
  path.
- The hard-coded fallback schedule is static, reviewed data — no injection vector.
- No PII, no compliance or privacy surface.

**Sign-offs:** data-feeds team and PM (Gabe Silva). No Product Security / Infrastructure Security
review expected to be required for an env-gated, reject-only change — flag if team convention
says otherwise.

## 10. Testing Plan

Highest-risk paths and how each is validated (unit/integration tests exist in the code; this is
the risk map):

1. **Session-boundary correctness** — the admit/reject decision at opens is the whole feature.
   Unit-tested across the boundary (report exactly at the start, 1ns before, during warm-up),
   for all three session types, including the extended stream's latest-transition rule and the
   Sunday overnight open. Integration-tested end-to-end with a mocked tradinghours schedule.
2. **The fallback and the skip** — tradinghours outage or unusable schedule → the hard-coded
   labeled schedule (`nyse/24/5`), → 503 when no hard-coded entry applies (unlisted
   market/type). Separately: requests **without** `sessionMarket`/`sessionMarketType` must skip
   the session-start check entirely — assert no tradinghours fetch is made and the request
   passes through with the flag on (matrix row 7a), with and without the staleness check
   enabled. Gating must never read
   `sessionBoundaries`/`sessionBoundariesTimeZone` (those are the smoother's alone). Each transition is unit-tested; the outage path is
   integration-tested with tradinghours failing.
3. **No regression with flags off** — decision-matrix row 1 must be byte-identical: the full
   pre-existing suite (including snapshots) runs unchanged against the new code.
4. **Timezone/DST handling** — session starts are computed in `America/New_York`; tests cover
   DST transition weekends so 04:00/09:30/16:00/20:00 ET resolve to the right UTC instants.
5. **Selection semantics unchanged** — eligibility fall-through, priority order, and no
   quality-based fail-over are covered by existing selection tests plus explicit no-fail-over
   cases (a pre-session regular report must not fall through to an in-session extended report).
6. **Empirical validation** — the staging soak (§6: Thursday→Monday) is the final check: real
   provider behavior at two+ regular opens and the Sunday overnight open, judged by the §7
   metrics. Unit tests cannot substitute for observing an actual provider warm-up window.

## 11. Ownership

- **Owning team:** data-feeds — the team that owns the tokenized-equity EA today.
- **On-call:** unchanged — the existing EA on-call rotation; **no new pager**. The new on-call
  _content_ is the §5 runbook updates (recognizing intended 503s, env-var rollback).
- **New operational responsibilities created:** per-session threshold tuning when the staleness
  follow-on lands; keeping the hard-coded fallback schedule current if NYSE 24/5 hours ever change
  (§12 #2).
- **Sign-offs:** data-feeds team + PM (Gabe Silva), per §9.
- **Follow-up items (out of scope here):** staleness-check enablement with tuned thresholds (§6);
  fallback caching for tradinghours outages (tracked separately).

## 12. Risks & Open Questions

| #   | Item                                                                                                                                                                                                                                                                                                                                 | Impact                                                                    | Likelihood                                                                                           | Mitigation                                                                                                                                                                                                                                                                                                                      | Owner |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | ~~**Gating fallback pending PM sign-off.**~~ **Resolved — PM sign-off received; recorded in [ADR-0006](./adr/0006-session-start-gating-no-tolerance-and-hard-coded-fallback.md).** §4 specifies the hard-coded labeled schedule (`nyse/24/5` only) as gating's sole fallback, since unlabeled boundaries cannot attribute a session. | Medium — changes degraded-mode behavior                                   | —                                                                                                    | Raise at next review; tier 3 is additive and only reachable when tiers 1–2 are unusable                                                                                                                                                                                                                                         | TBD   |
| 2   | **Hard-coded schedule drift.** Baked-in NYSE hours can go stale if the venue changes sessions; holidays/early closes are unknown to a fixed schedule.                                                                                                                                                                                | Wrong session starts during outages (admits or rejects the wrong reports) | Low — the fallback only runs during tradinghours outages; venue hours change rarely and loudly       | Keep the map minimal (one market/type); any change is a reviewed code edit; tradinghours monitoring limits outage windows                                                                                                                                                                                                       | TBD   |
| 3   | **Fallback activation not visible in telemetry** (see §4).                                                                                                                                                                                                                                                                           | Undetected reliance on the fallback schedule                              | Low                                                                                                  | Monitor tradinghours EA availability; log-based queries for the fallback error line and the distinct no-opening-transition line; `gatingSessionSource: 'FALLBACK'` response field (§4)                                                                                                                                          | TBD   |
| 4   | **The 5 `smoother: 'none'` feeds skip the session-start check** (requests without `sessionMarket`/`sessionMarketType`, §4 / matrix row 7a). This is a deliberate tradeoff to avoid validation/RDD changes in this rollout.                                                                                                           | The feeds with the observed warm-up failure mode stay unprotected         | Medium — the warm-up failure mode has recurred in production                                         | Track the follow-up: add the two params to the 5 feeds' RDD configs after gated-feed soak (the `smoother: 'none'` validation relaxation, inert to pricing, shipped in this PR — only RDD config changes remain); watch these feeds at session opens in the interim                                                              | TBD   |
| 5   | **`lastSeenTimestampNs` semantics unconfirmed** (publish time vs. last trade, per session type). If last-trade-based, thin sessions (pre-market/overnight) can be gated longer than publish latency at every open.                                                                                                                   | Longer rejection windows at thin-session opens                            | Medium — regular-session latency is stated at ~40–50s; no bound established for pre-market/overnight | Accepted deliberately — PM sign-off on the no-tolerance-at-open stance received, recorded in [ADR-0006](./adr/0006-session-start-gating-no-tolerance-and-hard-coded-fallback.md). Still to confirm: the publish-vs-last-trade semantics with the data-engine team; revisit only if the contract shows the windows are unbounded | TBD   |

# **Additional Considerations**

### New Product / Service?

No — a behavior change within the existing tokenized-equity EA, gated by new env vars. No
provisioning, upgrade, or shutdown-path considerations beyond the standard EA release process.

### Data Model Changes?

No. No schemas, storage, migrations, or backfills.

### Customer Impact?

- **Customer communication:** yes, lightweight — release notes should describe the new 503
  behaviors (intended rejections during provider warm-up/degradation) so downstream readers
  don't mistake them for outages. The §5 NOP-facing note covers this.
- **GTM coordination:** none.

### NOP Impact?

- **Rollout strategy:** none in scope (§3) — env-gated, NOPs adopt with their EA image/env
  updates on their own schedule.
- **Operational changes:** none required of NOPs; the §5 NOP-facing runbook note is advisory.

# Resources

- [Google Doc Replica of this TDD](https://docs.google.com/document/d/1ziBiHnXtXYcO_FmmH8k0n9hvT_imXa7MiuDksRu4-hM/edit?tab=t.0) (for feedback and comments)
