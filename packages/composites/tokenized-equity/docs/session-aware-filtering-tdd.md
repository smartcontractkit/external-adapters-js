# TDD — Session-aware data filtering in the Tokenized Equity EA

- **Status:** Draft (implementation in progress)
- **Owner:** Tokenized Equity EA
- **Proposal:** [Product Proposal: Session-aware data filtering in the Tokenized Equity EA](https://docs.google.com/document/d/183y0Hy_dp6XTAv7LpOAOb0mAxgCVEqhFamLD5EHvOek/edit)
- **Scope:** P0 session-switch filter. P1 freshness bound is explicitly out of scope for this change.

## 1. Problem

The Tokenized Equity EA publishes whatever report the Data Streams / Data Engine pipeline
returns. It does not check:

1. **When the report was produced** (`lastSeenTimestampNs`).
2. **Which session the report belongs to** (`marketStatus`) versus the session that should be
   open now.

That produces two production failure modes:

- **Stale prices.** A report hours old is republished, producing a 1–4% on-chain move that
  reverts when fresh data arrives.
- **Pre-open warm-up data.** Providers warm up the next session's endpoint before the open and
  send placeholder prices with fresh timestamps. A plain freshness bound cannot reject these;
  only a check against the _scheduled session start_ can.

## 2. Goals / non-goals

### Goals

- Withhold publication unless the selected report is for the session that is expected **now**
  and was produced **at or after that session's scheduled start**.
- Cover all boundary rows in the proposal: 04:00 pre-market, 09:30 regular, 16:00 post-market,
  20:00 overnight (Mon–Thu), Friday close, Sunday 20:00 reopen.
- Keep the existing smoothing behavior, including its boundary exclusions.
- Prefer correctness over liveness: when no report qualifies, return an error (503) so no new
  on-chain value is produced.

### Non-goals

- **P1 freshness bound.** The report timestamp is plumbed through and used for the session gate,
  but no generic `maxAge` is enforced. The existing `overnightStreamMaxAgeInSeconds` still works
  as before. A generic bound is a follow-up.
- Gating `smoother: 'none'`. That mode currently forbids all session parameters and is a raw
  passthrough; making gating independent of smoothing is a follow-up.
- Changing the smoothing algorithm or its calibration.
- Session-aware behavior for markets other than the configured `sessionMarket` /
  `sessionMarketType` pair.

## 3. Current behavior (baseline)

Flow: endpoint transport → `smoothedStreamPrice()` → `getPrice()` + `calculateSecondsFromTransition()`.

- `getPrice()` (`src/lib/streams.ts`) fetches the regular, extended and overnight stream reports in
  parallel and selects **one** by report status, in priority order:
  regular `REGULAR` → extended `PRE_MARKET`/`POST_MARKET` → overnight `OVERNIGHT`. If none
  matches, it throws 503 `Market is not open`.
- `calculateSecondsFromTransition()` (`src/lib/session/session.ts`) fetches `market-session` from
  the tradinghours EA, filters to `PRE_MARKET`/`POST_MARKET`/`OVERNIGHT`, excludes Sunday 20:00,
  and returns the signed distance to the nearest boundary. On failure it uses the configured
  `sessionBoundaries` fallback.
- The smoother (EMA/Kalman) is always fed the raw price; the raised-cosine blend fades between
  the smoothed value and the target price in the `-10s`/`+60s` window around those boundaries.
- `lastSeenTimestampNs` is already present in every stream payload (`data.<stream>`), but
  `getPrice()` does not return it.

Notably, the current selection is by the _report's own_ status, so a stale `POST_MARKET` report
can be selected while the overnight session is open, and a pre-open `REGULAR` report can be
selected before 09:30.

## 4. Design

### 4.1 Sources of truth

| Question                             | Source                                                                                   | Why                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| What session should be open now?     | tradinghours EA `market-status` (`type = sessionMarketType`, `weekend = sessionWeekend`) | It is the same calendar the product uses for 24/5 status and it already returns `WEEKEND`, including the weekly override and holiday closures. |
| When did that session start?         | tradinghours EA `market-session`                                                         | It already returns scheduled starts, including `REGULAR` (the composite currently filters `REGULAR` out for smoothing).                        |
| When was the report produced?        | `lastSeenTimestampNs` on the selected stream report                                      | Provider-supplied event time, in nanoseconds.                                                                                                  |
| Which session does the report claim? | `marketStatus` on the selected report                                                    | Used as a cross-check against the schedule.                                                                                                    |

`market-status` is only used for the **expected status**. It is intentionally _not_ used as the
timestamp source: TradingHours' current status can lag a boundary by a few seconds, and the gate
must withhold rather than accept a report for the wrong session.

### 4.2 New session context

`getSessionContext()` replaces `calculateSecondsFromTransition()` and returns:

```ts
type SessionEvent = {
  status: TwentyfourFiveMarketStatus // UNKNOWN for fallback boundary entries
  startMs: number
}

type SessionContext = {
  secondsFromTransition?: number // unchanged smoothing input, computed from smoothing events
  source: 'TRADINGHOURS' | 'FALLBACK'
  events: SessionEvent[] // all scheduled starts, including REGULAR; sorted ascending
  expectedStatus?: TwentyfourFiveMarketStatus // from market-status, or latest event on failure
  weekend: string // DHH-DHH:TZ, used by the market-status call
}
```

- `events` includes `REGULAR` and no longer drops Sunday 20:00. The Sunday exclusion is applied
  when computing `secondsFromTransition` only, preserving current smoothing behavior.
- `market-status` is fetched in parallel with `market-session`. If it fails, `expectedStatus`
  falls back to the status of the latest scheduled event and a warning is logged (weekend
  detection is then degraded, but warm-up and cross-session checks still work).
- If `market-session` fails, the configured `sessionBoundaries` are used as `UNKNOWN` events
  (`source = 'FALLBACK'`); the gate then performs the start-time check only. If there are no
  fallback boundaries either, there is no schedule to gate against, so the gate is skipped and a
  warning is logged (the pre-existing liveness behavior).
- `market-status` is only called when `sessionMarketType` is `24/5`; other market types use the
  latest scheduled event's status, because their status enum is different.

### 4.3 Gate predicate

`evaluateSessionGate()` is a pure function, called for every candidate report:

```ts
type GateDecision = { eligible: true } | { eligible: false; reason: string }

function evaluateSessionGate({ report, session, nowMs }): GateDecision {
  const reportMs = Number(BigInt(report.lastSeenTimestampNs) / 1_000_000n)

  if (session.source === 'FALLBACK') {
    const current = latestEventAtOrBefore(session.events, nowMs)
    if (!current) return reject('no scheduled session start is known')
    if (reportMs < current.startMs) return reject('report predates the current session start')
    return accept()
  }

  if (session.expectedStatus === undefined) return reject('cannot determine the expected session')
  if (expectedStatus is WEEKEND or UNKNOWN) return reject('market is closed')

  const current = latestEventAtOrBefore(session.events, nowMs)
  if (!current) return reject('no scheduled session start is known')
  if (current.status !== expectedStatus) return reject('schedule and market status disagree')
  if (report.marketStatus !== expectedStatus) return reject('report belongs to a different session')
  if (reportMs < current.startMs) return reject('report predates the session start')

  return accept()
}
```

The gate is applied **per candidate stream**, not just to the stream that `getPrice()` would
have picked. This matters at transitions: at 20:00:10 the extended feed may still return a stale
`POST_MARKET` report while the overnight feed already has a valid `OVERNIGHT` report. Selecting
first and gating second would withhold until the extended cache flips; gating first and selecting
second publishes the valid overnight report as soon as its timestamp crosses 20:00.

### 4.4 Stream selection refactor

`src/lib/streams.ts` is split into:

- `getStreams()` — fetches all three reports with `Promise.allSettled`, returns the available
  reports plus per-stream errors.
- `selectStream(streams, isEligible?)` — walks the existing priority order, applies the built-in
  "is this status active for this stream" check, then the optional gate predicate. Returns the
  first eligible report plus a reason for each rejected candidate.
- `getPrice()` — thin wrapper that calls both without a gate; retained for direct callers and
  existing tests.

`smoothedStreamPrice()` fetches `getStreams()` and `getSessionContext()` in parallel, then calls
`selectStream()` with the gate. If no candidate is eligible it throws an `AdapterError` with
`statusCode: 503` and a message that lists each stream's rejection reason. The transport converts
that into an error response with no `result`, so the on-chain value is left untouched.

The selected report supplies `mid`, `bid`/`ask` (spread), `decimals`, `marketStatus` and
`lastSeenTimestampNs`, as today.

### 4.5 Behavior matrix

| Boundary                     | Expected report                           | Gate result at +15s                                | Smoothing                                                  |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| 04:00 overnight → pre-market | extended, `PRE_MARKET`, ts ≥ 04:00        | rejects 03:59:59; accepts 04:00:12                 | existing transition                                        |
| 09:30 pre-market → regular   | regular, `REGULAR`, ts ≥ 09:30            | rejects 09:29:59; accepts 09:30:12                 | **excluded** (no `REGULAR` boundary in smoothing events)   |
| 16:00 regular → post-market  | extended, `POST_MARKET`, ts ≥ 16:00       | rejects 15:59:59; accepts 16:00:12                 | existing transition                                        |
| 20:00 Mon–Thu → overnight    | overnight, `OVERNIGHT`, ts ≥ 20:00        | rejects 19:59:59; accepts 20:00:12                 | existing transition                                        |
| Friday 20:00 → weekend       | none                                      | all reports rejected (`market-status` = `WEEKEND`) | n/a                                                        |
| Sunday 20:00 → overnight     | overnight, `OVERNIGHT`, ts ≥ Sunday 20:00 | rejects a Friday report; accepts Sunday 20:00:12   | **excluded** (Sunday 20:00 filtered from smoothing events) |

Timing consequence is unchanged: if the first qualifying report is at +15s, the existing +15s
raised-cosine weight applies; if it is after +60s the window is over and the output is raw.
Smoothing is **not** restarted when the first valid report arrives.

### 4.6 Input / configuration changes

Add one optional string input to the shared definition (`src/endpoint/common.ts`):

```ts
sessionWeekend: {
  type: 'string',
  description:
    'Weekly closure window in DHH-DHH:TZ used by the session gate. Defaults to 520-020:<sessionBoundariesTimeZone>.',
}
```

- Default at runtime: `520-020:<sessionBoundariesTimeZone>` (Fri 20:00 → Sun 20:00 in the session
  timezone), matching the product's 24/5 definition.
- Validated with the same `DHH-DHH:TZ` shape as the framework's `weekend` parameter when supplied.
- Added to the transports' dedupe keys so two subscriptions that differ only by this value are not
  collapsed.

`sessionBoundaries` keeps its current meaning (smoothing fallback). It is **not** extended with
09:30 because doing so would add a smoothing transition at the regular open. This is a documented
fallback limitation: when tradinghours is unavailable, the regular open is not gated unless 09:30
is already in the fallback list.

## 5. Alternatives considered

1. **Observe the provider's `marketStatus` transition.** Rejected: the provider can flip status and
   send a warm-up report timestamped before the scheduled open, which is exactly the incident.
   A schedule is required.
2. **Freshness bound only (P1).** Rejected for the warm-up case: warm-up reports have fresh
   timestamps.
3. **Hard-code the weekly close (Fri 20:00–Sun 20:00).** Rejected: ignores holidays and any
   market-specific weekend definition; `market-status` already models this correctly.
4. **Extend the tradinghours `market-session` response with closed phases.** This would let the
   composite use one call and no new input, but it changes another adapter's response contract and
   creates a deployment dependency. Kept as a future simplification; the current design is
   self-contained in the composite and uses existing endpoints.
5. **Use the first report after the boundary without a timestamp check.** Rejected: a report
   produced before the boundary can be delivered after it, which is the warm-up failure mode.

## 6. Risks and mitigations

| Risk                                           | Impact                                                           | Mitigation                                                                                                                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tradinghours `market-status` lag at a boundary | A valid report is withheld for a few seconds                     | Reject is fail-safe (no on-chain move); monitor rejection reasons; the schedule's start is still enforced.                                                                                           |
| tradinghours outage                            | Gate degrades to fallback boundaries (no 09:30/closure coverage) | Log a warning and emit the existing `sessionSource = FALLBACK`; keep publishing to avoid a total feed outage. With no fallback boundaries at all, the gate is skipped. P1 freshness is the backstop. |
| `market-status` outage                         | Weekend detection lost; all other checks still run               | Fall back to the latest scheduled event's status and log.                                                                                                                                            |
| Valid report arrives > 60s after the open      | Output is raw (no smoothing)                                     | Accepted, per the proposal's explicit timing consequence.                                                                                                                                            |
| Provider stops sending after Friday close      | A stale cached report could pass the fallback gate               | `market-status` returns `WEEKEND` while the schedule is available; P1 closes the residual gap.                                                                                                       |
| Per-asset smoother state already global        | Gate is stateless; no new shared state                           | Gate reads only the current schedule and report.                                                                                                                                                     |
| `smoother: 'none'` bypasses the gate           | Unsmoothed feeds remain at risk                                  | Explicit non-goal; document and follow up with a gate-only mode.                                                                                                                                     |

## 7. Observability

- Accepted responses add `sessionGate` to the output:
  `{ expectedStatus, sessionStart, reportTimestamp, source }`.
- Rejected responses are 503 with a message naming the rejected stream(s), expected status,
  session start and report timestamp, e.g.:
  `No eligible session report: regular: report PRE_MARKET last seen 09:29:59.000Z predates REGULAR session start 09:30:00.000Z; extended: report POST_MARKET does not match expected REGULAR`
- Existing `sessionSource` continues to indicate `TRADINGHOURS` vs `FALLBACK`.
- Log a warning when the market-status lookup fails or the fallback schedule is used.

## 8. Rollout

1. Deploy the composite with the gate enabled by default. No new required input; `sessionWeekend`
   defaults to the 24/5 window.
2. Validate on one 24/5 feed through a full overnight → pre-market → regular → post-market cycle,
   including a Sunday reopen.
3. Watch 503 rates and rejection reasons. Expected 503s are limited to the first seconds after a
   boundary and the Friday–Sunday closure.
4. Rollback is the previous image (the change is isolated to the composite).

A kill switch was considered but not added; if operational rollback without redeploy is required,
add an adapter setting (e.g. `SESSION_GATE_ENABLED`, default `true`) in a follow-up.

## 9. Test plan

Unit:

- `sessionGate.test.ts`
  - accepts a report at/after the session start;
  - rejects a report one second before the start (each boundary);
  - rejects a report for the wrong session (e.g. `POST_MARKET` at 20:00);
  - rejects all reports when `expectedStatus` is `WEEKEND`/`UNKNOWN`;
  - rejects when the schedule and `market-status` disagree;
  - fallback: start-only check, no status check;
  - malformed/missing `lastSeenTimestampNs` is rejected.
- `session.test.ts`
  - `REGULAR` and Sunday 20:00 are present in `events` but excluded from `secondsFromTransition`;
  - market-status failure falls back to the latest event status;
  - market-session failure falls back to `sessionBoundaries`.
- `streams.test.ts`
  - `getStreams` returns partial results and errors;
  - `selectStream` priority order with/without a gate;
  - falls through to the overnight report when the extended report fails the gate.
- `smoothedPrice.test.ts`
  - gate is evaluated once per tick, before smoothing;
  - 503 has no result and the error lists reasons;
  - the selected report's timestamp is the one gated.

Integration:

- Existing endpoint snapshots regenerated. The suite mocks a tradinghours outage with empty
  fallback boundaries, which intentionally leaves the gate disabled.
- Follow-up integration cases (not in this draft): a successful tradinghours mock with a warm-up
  rejection at each boundary, weekend rejection, and Sunday reopen acceptance. These paths are
  covered at unit level by `sessionGate.test.ts` and `streams.test.ts`; wiring them through the
  `TestAdapter` requires updating the suite's mocked clock and shared nock interceptors.

Manual / staging:

- Replay a recorded sequence from the Oct 20 overnight incident and a pre-open warm-up sequence;
  confirm no output until the first in-session report.

## 10. Open questions

1. **P1 freshness bound.** What bound is safe for overnight (where long gaps are normal)? Proposed
   follow-up: optional per-stream `maxReportAgeInSeconds`, default off.
2. **Fallback coverage.** Should the regular open be gated when tradinghours is down? That would
   require a second fallback list (gate starts vs smoothing boundaries) or a status-aware fallback
   format.
3. **`smoother: 'none'`.** Should gating be decoupled from smoothing so raw feeds are also
   protected?
4. **Fail-closed on schedule outage.** Current design degrades to fallback start-time gating rather
   than halting all feeds. Confirm this is the desired trade-off.
