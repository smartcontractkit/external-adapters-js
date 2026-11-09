# 0004. The price and Issuer Multiplier are read independently each cycle, assuming 18 decimals

Status: accepted
Date: 2026-11-03
Risk acceptance: accepted by Product (Gabe Silva) and GTM (Karim Yassine Fanti) on 2026-11-04

## Context

A tokenized price is the 24/7 Price times the Issuer Multiplier. The 24/5 endpoints
already read both concurrently with no consistency check and hard-code 18 multiplier
decimals (`xstocksPrice.ts`). Product accepted that pattern for 24/5; reusing it for 24/7
extends the exposure to weekends and overnight, so it needs re-acceptance.

## Decision

- Each background cycle reads the data-engine price and the Issuer Multiplier concurrently
  (`Promise.all`), with no block or timestamp alignment between them.
- The Issuer Multiplier is read from chain every cycle, with no cache. Only the RPC
  provider is reused.
- `MULTIPLIER_DECIMALS` is hard-coded to 18 for every Issuer, not read from chain. This
  deliberately reverses the original decision record, which read the scale on-chain for
  Robinhood (ERC-8056 `decimals()`) and xStocks (underlying `decimals()` via `asset()`) and
  hard-coded 18 only for the Coinbase and Ondo registries. The reversal came in the review
  refactor (#5567) for simplicity and consistency with the 24/5 endpoints, and GTM confirmed
  18 decimals for every Issuer.
- The price is requested at 18 decimals, multiplied at 36 and truncated once to the output
  decimals, so the result is not truncated twice (see the decision record doc, §3).

Rejected:

- Caching the multiplier with a TTL: a multiplier change or pause would show up late.
- Reading at a pinned block: no way to align a data-engine timestamp to a block.
- Reading the multiplier scale on-chain where exposed, with cached metadata: more RPC calls
  and code for no difference on today's assets, which are all 18 decimals.

## Consequences

- A multiplier change or Asset Paused takes effect within one cycle.
- RPC load is one read per subscribed payload per cycle (two for Robinhood:
  `uiMultiplier`, `oraclePaused`) across Base, Ethereum and Robinhood chain.
- Onboarding a new Issuer or asset requires confirming its multiplier uses 18 decimals.

## Risks accepted

- **One-cycle skew around a multiplier update.** A result can pair the old price with the
  new multiplier, or the reverse. Asset Paused limits this for Robinhood, Coinbase and
  Ondo; xStocks has no such cover (see [0002](./0002-xstocks-ignores-asset-paused.md)).
  Owner: Product.
- **Pending multipliers.** Robinhood schedules changes with
  `newUIMultiplier()` / `effectiveAt()` and Ondo stores a `pendingSValue`; only the current
  value (`uiMultiplier()`, `getSValue()`) is read. If the current value does not switch over
  on its own at the effective time, feeds publish the old multiplier with status 200 until
  the Issuer applies it. Asset Paused mitigates this when the Issuer pauses across the
  change. Owner: GTM to confirm switch-over behavior with Robinhood and Ondo; Product to
  accept until then. Revisit on the Issuers' answer or the first scheduled change after
  launch, which should be watched live.
- **RPC outage causes a pricing outage (accepted by Product).** An RPC outage or rate limit
  becomes a 5xx for every payload on that chain, so the node produces no price. Fails
  closed. Detection relies on existing feed alerting: on-call is alerted if the outage
  reaches consensus failure or a missed heartbeat. Owner: Product. Revisit on RPC
  rate-limit errors or a large growth in payloads.
- **Hard-coded 18 decimals (fails open, accepted by GTM).** GTM (Karim Yassine Fanti, in
  Slack) confirmed 18 decimals for Ondo, Coinbase, Robinhood and the wrapped xStocks token
  (`convertToAssets`), and approved hard-coding them. The legacy xStocks
  API integration (float with 16 decimals, used for Streams v10) is not in this adapter and
  is out of scope. If an Issuer upgrades its contract or a new asset uses another precision,
  every price is off by a power of 10 with status 200. Owner: GTM. Revisit when
  onboarding an Issuer or asset, or on an Issuer contract upgrade; reading `decimals()`
  where exposed and failing closed on mismatch is the cheap mitigation.
