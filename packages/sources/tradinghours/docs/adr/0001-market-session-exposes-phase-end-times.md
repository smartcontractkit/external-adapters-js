# 0001. market-session exposes phase end times so callers can derive closed spans

Status: proposed
Date: 2026-11-13
Cross-references:
[tokenized-equity ADR-0007](../../../composites/tokenized-equity/docs/adr/0007-247-session-start-gating-weekend-and-fail-closed.md),
[tokenized-equity 24/7 session-start gating TDD](../../../composites/tokenized-equity/docs/issuer-247-session-start-gating-tdd.md)

## Context

The upstream TradingHours hours-multiday API (`/v3/markets/hours-multiday`) returns every
schedule phase with both a `start` and an `end`. The `market-session` endpoint of this adapter
has always emitted only the start (`{ status, statusString, time }`), discarding `end`.

The market defines _trading_ phases — overnight, pre-market, regular, post-market — and nothing
else. A weekend or a holiday is not a session the market defines; it is a **closed span**: the
absence of phases between the end of the last trading phase and the start of the next one. In
the upstream model (and therefore in this endpoint's response today) a closed span exists only
implicitly, as a gap between timestamps. Callers that need to reason about when a closure
_began_ — for example, tokenized-equity's 24/7 session-start gating, which must reject a report
carrying `marketStatus: WEEKEND` when the report predates the start of the current closed span —
cannot compute that boundary from start times alone: the transition list jumps from the Friday
post-market _start_ (16:00 ET) straight to the Sunday overnight open, and the Friday 20:00 close
appears nowhere.

The ecosystem already reports closures as `WEEKEND`: this adapter's own `market-status`
transport maps `Closed` with an unrecognized reason (e.g. a holiday name like "Veterans Day")
to `WEEKEND`, so a report produced during a holiday closure carries the same status as one
produced on a Saturday. A caller given phase end times can therefore derive the start of the
current closed span — weekend _or_ holiday — with one mechanism and no holiday-specific logic:
the span begins at the `end` of the last trading phase before the gap (e.g. Wednesday 20:00 ET
post-market close before Thanksgiving), which is holiday/early-close aware because it comes
from real schedule data.

## Decision

Add an additive `endTime` field to each `market-session` transition, passing through the
upstream phase `end` unchanged:

```ts
{
  status, statusString, time, endTime
}
```

No other behavior changes: status classification, the `UNKNOWN` filter, and all existing fields
are untouched. The endpoint continues to return only the four real trading-session statuses; it
still never emits a `WEEKEND` transition. Deriving closed spans from the returned end times is
the caller's responsibility — this endpoint exposes the raw schedule, not policy.

## Considered Options

- **Synthesize a `WEEKEND`/closed-span transition inside this adapter** (emitting a transition
  at the last phase `end` before each multi-day gap): rejected for now. It would put
  closed-span policy in a shared source adapter, and the only consumer (tokenized-equity) can
  derive the same boundary from `endTime`. Revisit if a second consumer ever needs closed-span
  transitions directly.
- **Callers hardcode the close time** (e.g. Friday 20:00 ET): rejected; wrong on holiday
  early-closes (e.g. a 13:00 ET close before July 4th) and on any venue schedule change.
- **Status quo (starts only):** rejected; the closed-span start is not computable from start
  times alone.

## Consequences

- **Additive and safe:** the only in-monorepo consumer of `market-session` is the
  tokenized-equity composite; existing fields are unchanged, and consumers that ignore
  `endTime` are unaffected.
- Callers can derive the start of any closed span — weekend or holiday — from real schedule
  data, including holiday early-closes, with no holiday-specific code.
- The endpoint's response now mirrors the upstream phase shape (start _and_ end), so a caller's
  hard-coded fallback schedule can be shaped congruently and evaluated with the same code path
  (this is what tokenized-equity's flattened fallback schedule does).
- The upstream phase `end` of one phase typically equals the `start` of the next; the value is
  only load-bearing at the boundary before a closed span.

## Risks accepted

- **`endTime` semantics are upstream's.** We pass the field through without interpreting it; if
  TradingHours ever reports phase ends that differ from the next phase's start in surprising
  ways, consumers deriving closed spans inherit that. Low likelihood; mitigated by
  tokenized-equity's integration tests and its hard-coded fallback. Owner: engineering
  (data-feeds).
