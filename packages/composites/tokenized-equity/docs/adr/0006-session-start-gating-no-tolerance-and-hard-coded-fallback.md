# 0006. Session-start gating rejects pre-session reports with no pre-open tolerance, falling back to a hard-coded labeled schedule

Status: accepted
Date: 2026-11-06
Risk acceptance: accepted by Product (Gabe Silva) — the no-tolerance-at-open stance and the
hard-coded fallback schedule, resolving open items #1 and #5 of the
[stream freshness gating TDD](../stream-freshness-gating-tdd.md)

## Context

Providers warm up the regular-session stream before the open and transmit invalid
placeholder prices with _fresh_ timestamps (updated milliseconds before the open). An
age-based freshness bound cannot catch them, so the EA gates the selected stream on the
session start: a report whose `lastSeenTimestampNs` predates the current session's start
is rejected with a 503 (`PRE_SESSION`), even when it is fresh by age. The session start
comes from the tradinghours EA's market-session schedule.

Two design decisions needed explicit acceptance:

1. **Tolerance at the open.** The provider only guarantees validity for updates
   timestamped after the open, and the first valid update can arrive ~40–50 seconds in.
   Admitting reports timestamped up to `sessionStart − N` would shrink the rejection
   window but re-admit warm-up placeholders produced inside it.
2. **Degraded-mode schedule source.** When the tradinghours schedule is unusable (fetch
   failure, or no transition opening the selected session), gating needs a fallback. The
   smoother's per-feed `sessionBoundaries` parameter was the earlier choice, but its
   times are unlabeled (a boundary cannot be attributed to a session) and the
   conventional values (`04:00` / `16:00` / `20:00` ET) lack the 09:30 regular open —
   gating on them would silently weaken exactly the regular-open protection the feature
   exists for.

## Decision

- **No pre-open tolerance.** The gate rejects whenever `lastSeenTimestampNs` predates
  the session start, with no `sessionStart − N` allowance. Every session open is a
  rejection window whose length is the provider's first-post-open observation latency
  (~40–50s stated for the regular session; unbounded so far for the thinner pre-market
  and overnight sessions). Correctness is prioritized over availability at session opens.
- **Hard-coded labeled fallback schedule in the EA** (`lib/session/fallbackSessionSchedule.ts`),
  keyed by market/type and defined only for `nyse/24/5` — the only market with a
  dedicated 24/5 schedule in tradinghours and the only combination TE feeds serve. It is
  labeled, so the fallback keeps full gating precision: the true 09:30 regular open and
  the Sunday 20:00 overnight open. Market/types without an entry get no fallback: with
  gating enabled and tradinghours unusable, the request 503s — loud rather than silently
  wrong. Fallback activation is observable via the `TradingHoursEA request failed` / `no
transition opening the selected session` log lines and the
  `gatingSessionSource: 'FALLBACK'` response field.
- Gating never reads `sessionBoundaries` / `sessionBoundariesTimeZone`; the timezone for
  the tradinghours fetch and the fallback comes from the schedule map entry
  (`nyse/24/5` → `America/New_York`). `sessionBoundaries` remains the _smoother's_
  fallback, unchanged.

This supersedes the earlier "gating mirrors the smoother's `sessionBoundaries` fallback"
decision.

## Considered Options

- **A pre-open tolerance (`sessionStart − N`):** rejected; warm-up placeholders are
  transmitted milliseconds before the open, so any N re-admits them.
- **Fail open when the schedule is unusable:** rejected; it disables the warm-up check
  exactly when schedule uncertainty is highest, and silently.
- **Fail closed on any tradinghours outage:** rejected; it would 503 fresh in-session
  data for the duration of the outage.
- **Gate on the per-feed `sessionBoundaries` fallback:** rejected; unlabeled times and
  no 09:30 regular open (above).
- **A local cache of the last good tradinghours schedule:** follow-up work, tracked
  separately; not needed for launch because the fallback covers the only served market.

## Consequences

- Brief `PRE_SESSION` rejections are **expected** at every session open until the first
  valid provider update (~40–50s for the regular session). Runbooks and alert tuning
  treat these as the mitigation working, not an outage.
- The hard-coded schedule can drift from venue reality (hour changes, holidays, early
  closes are unknown to it). It only runs during tradinghours outages, and changing it is
  a reviewed code edit. Keeping it minimal (one market/type) bounds the drift surface.
- Adding a market/type to gating is one reviewed map entry in
  `fallbackSessionSchedule.ts`; without it, that market fails closed during a
  tradinghours outage.

## Risks accepted

- **Rejection window at thin-session opens may exceed publish latency.** If
  `lastSeenTimestampNs` proves to be last-trade-based rather than publish-based, the
  pre-market and overnight sessions could be gated longer than their ~publish latency at
  every open. Accepted deliberately (correctness over availability); confirm the
  semantics per session type with the data-engine team and revisit only if the windows
  prove unbounded. Owner: Product.
- **Hard-coded schedule drift** (TDD §12 #2). Wrong session starts during outages can
  admit or reject the wrong reports. Low likelihood: the fallback only runs during
  tradinghours outages, venue hours change rarely and loudly, and tradinghours
  monitoring limits outage windows. Owner: engineering (data-feeds).
- **Fallback activation is log-based only** (no metric). Mitigated by tradinghours EA
  availability monitoring plus the distinct log lines and `gatingSessionSource` response
  field. Owner: engineering (data-feeds).
