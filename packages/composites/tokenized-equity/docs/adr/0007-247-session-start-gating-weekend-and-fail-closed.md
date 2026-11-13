# 0007. 24/7 session-start gating: report-declared sessions, a derived WEEKEND start, and a fail-closed default

Status: proposed

Date: 2026-11-13

Risk acceptance: pending Product (Gabe Silva) — the zero-tolerance stance extended to 24/7 and
the fail-closed default on indeterminate sessions, resolving risk items #1 and #2 of the
[24/7 session-start gating TDD](../issuer-247-session-start-gating-tdd.md)

## Context

[ADR-0001](./0001-issuer-price-247-is-a-new-issuer-agnostic-endpoint.md) introduced the 24/7
`issuer-price-247` endpoint with the deliberate stance: **"No Market Status gate. A 24/7 Price
is priced around the clock, so there is no market-closed 503 and no stream selection by
session."** That remains correct for market-closed gating — but it leaves the endpoint with no
protection against the pre-session "warm-up" failure mode that
[ADR-0006](./0006-session-start-gating-no-tolerance-and-hard-coded-fallback.md) addressed for
24/5: providers may not have not yet produced a price following a session open, with fresh
timestamps within the active session. The 24/7 feed crosses every underlying equity session
boundary — pre-market, regular, post-market, overnight, and the weekend — so the exposure exists
at every boundary.

Introducing session-start gating on 24/7 (see the TDD) required four decisions with
risk-bearing consequences:

1. **Where the session comes from.** 24/5 gating derives sessions from the tradinghours
   schedule and does not use the report's session. With a single 24/7 stream and
   no stream selection step (which exists for 24/5), 24/7 will use the report's `marketStatus` field.
2. **Zero tolerance at the open, again.** ADR-0006 accepted ~40–50s rejection windows at every
   24/5 session open. Extending that stance to 24/7
   multiplies the boundaries (including thin overnight sessions and the Friday weekend start).
3. **A WEEKEND session start must exist.** A 24/7 feed reports through the weekend, but the
   tradinghours `market-session` endpoint can never emit a WEEKEND transition — the upstream
   API represents the weekend as an absence of phases. The weekend start has to be derived, and
   it must not be treated as Friday's post-market _open_.
4. **Indeterminate sessions on a previously ungated endpoint.** When the report's
   `marketStatus` is UNKNOWN/unmapped, or no schedule tier can resolve the session start,
   gating must choose: 503 (fail closed — a behavior change for an endpoint that has never
   gated, turning previously-good responses into 503s during tradinghours outages) or serve
   (fail open — silently disabling the gate when information is scarcest).

## Decision

- **The report's `marketStatus` declares its session.** The gate maps the report's
  `marketStatus` to a session start (REGULAR → regular open; PRE/POST*MARKET → pre-market open;
  OVERNIGHT → overnight open; WEEKEND → weekend start) and rejects with 503 `PRE_SESSION` when
  `lastSeenTimestampNs` predates that start. Session start times come from tradinghours,
  falling back to the hard-coded schedule, as on 24/5. There is no market-closed 503: the feed
  keeps serving around the clock. This amends ADR-0001's "No Market Status gate" for 24/7 to
  exclude \_session-start* gating from that stance; the no-market-closed-gate stance is
  unchanged.
- **Zero tolerance, extended from ADR-0006.** No `sessionStart − N` allowance on 24/7; every
  session boundary is a rejection window of the provider's first-post-open observation latency.
  ADR-0006's risk acceptance is extended to cover the 24/7 endpoint.
- **The WEEKEND session start is derived in tokenized-equity** as the `endTime` of the last
  POST_MARKET phase before the weekend gap (Friday 20:00 ET in a normal week, correct on
  holiday early-closes). To make it derivable, the tradinghours `market-session` transport
  gains an additive `endTime` passthrough (the upstream API already returns phase ends; the
  parser discards them today; tokenized-equity is the endpoint's only consumer). The hard-coded
  fallback schedule is flattened to a single per-market `nyse` entry holding all five session
  opens plus end times — shaped congruently with the tradinghours response, times as named
  constants — shared by 24/5, regular, and 24/7 callers, with 24/5 gating decisions unchanged.
- **Fail closed on indeterminate sessions, behind a flag.**
  `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION` defaults to **true**: UNKNOWN or
  unresolvable sessions 503 with `Session start unknown`. Setting it `false` serves the report
  with a warning log — a no-deploy escape hatch if Product's risk posture changes.

## Considered Options

- **Schedule-derived sessions (the 24/5 approach):** rejected; with one 24/7 stream there is no
  selection to gate, and the report's own `marketStatus` is the tightest, authoritative
  declaration of which session produced it.
- **A pre-open tolerance on 24/7:** rejected; per ADR-0006, warm-up placeholders are
  transmitted milliseconds before the open, so any tolerance incorectly re-admits them.
- **Synthesizing WEEKEND transitions inside the tradinghours adapter:** rejected for now; it
  puts policy in a shared source adapter where pure plumbing (the `endTime` passthrough)
  suffices, and keeps derivation and its tests in the only consumer. Revisit if a second
  consumer ever needs weekend transitions.
- **Fallback-only weekend starts (no tradinghours change):** rejected; a hardcoded Friday 20:00
  is wrong on holiday early-closes, and the two schedule tiers would disagree in coverage.
- **Post-market start + fixed 4h duration:** rejected; a magic constant that lies on half-day
  Fridays and any schedule change.
- **Fail open on indeterminate sessions:** rejected as the default; it silently disables the
  gate exactly when schedule uncertainty is highest. Retained as the non-default flag position
  given 24/7's previously ungated behavior.
- **A separate `nyse/24/7` fallback key:** rejected; it duplicates the same times and can
  drift. The flattened per-market schedule is filtered by each caller's eligible statuses, so
  one entry serves all callers.

## Consequences

- Brief `PRE_SESSION` rejections are **expected** at every 24/7 session boundary — including
  the Friday 20:00 weekend start and the Sunday 20:00 overnight open — until the first valid
  provider update. Runbooks and alert tuning treat these as the mitigation working, not an
  outage.
- With the flag enabled and fail-closed on, tradinghours outages can produce 503s on an
  endpoint that previously never rejected — visible via the established
  `TradingHoursEA request failed` log line and `gatingSessionSource: 'FALLBACK'` response
  field, and reversible without a deploy via the fail-on-indeterminate flag.
- The tradinghours `market-session` response gains a field; the change is additive and its only
  consumer is tokenized-equity.
- The flattened fallback schedule becomes the single per-market source of truth for session
  times (now including the Friday weekend start); changing venue hours is one reviewed edit.
- Rollout posture: staging dark (verify there is no-regression) → staging enabled → NOPs with the flag
  enabled.

## Risks accepted

- **Rejection windows at every 24/7 boundary, of unconfirmed length for thin sessions.** If
  `lastSeenTimestampNs` proves to be last-trade-based rather than publish-based, overnight and
  weekend boundaries could be gated longer than publish latency. Accepted deliberately
  (correctness over availability), extending ADR-0006's stance; confirm the semantics with the
  data-engine team and revisit only if windows prove unbounded. Owner: Product.
- **Fail-closed is a behavior change for a previously ungated endpoint.** 503s during schedule
  outages where 200s were served before. Mitigated by tradinghours monitoring, the flattened
  fallback covering `nyse`, and the `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION`
  escape hatch. Owner: Product.
- **Hard-coded schedule drift**, now including the Friday weekend start (TDD §12 #3). Low
  likelihood: the fallback only runs during tradinghours outages, venue hours change rarely and
  loudly, and changes are reviewed code edits. Owner: engineering (data-feeds).
- **24/5 regression via the fallback flatten.** Mitigated by the existing 24/5 session-start
  test suites passing unchanged (TDD §10); the flatten is a data-layout refactor, not a logic
  change. Owner: engineering (data-feeds).
