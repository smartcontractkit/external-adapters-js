# 0002. xStocks prices ignore Asset Paused

Status: accepted (retroactive)
Date: 2026-11-03
Risk acceptance: accepted by GTM (Karim Yassine Fanti) on 2026-11-04

## Context

This ADR records a past decision rather than making a new one: the `xstocks` endpoint
has never read Asset Paused. It is written down now because `issuer-price-247` reads the
pause flag for the other Issuers, which makes the xStocks exception visible.

Robinhood (`oraclePaused`), Coinbase (`getOracleParams().paused`) and Ondo
(`getSValue().paused`) expose Asset Paused, and `issuer-price-247` returns a 503 for a
paused asset. The xStocks wrapper exposes `isPaused()` too. The original decision record left this as an open question.

## Decision

xStocks ignores Asset Paused, by GTM decision. The flag is not read, and an xStocks asset
is never treated as paused.

- Scope: both the `xstocks` endpoint and `issuer-price-247`, for every xStocks asset.
- Reason: xStocks does not pause today, so ignoring the flag changes no observable behavior
  and keeps main's behavior for the `xstocks` endpoint.
- GTM confirmed the xStocks feeds have no market pauses by design, may add them in the
  future, and that the other Issuers respect pauses for now.

## Consequences

- Pause handling is inconsistent across Issuers by design. Do not add an xStocks pause
  check without superseding this ADR.
- Unit tests pin the behavior: a paused xStocks asset still returns a price.

## Risks accepted

- **Pricing continues through a pause.** If xStocks starts pausing, typically around a
  corporate action, feeds keep publishing a price whose Issuer Multiplier may be wrong.
  This compounds the one-cycle skew in
  [0004](./0004-price-and-multiplier-are-read-independently.md), which the other Issuers'
  pauses cover. Owner: GTM. Dormant while xStocks does not pause.
- Revisit when xStocks starts using its pause flag, or after an xStocks corporate action
  that leaves the multiplier wrong while paused.
