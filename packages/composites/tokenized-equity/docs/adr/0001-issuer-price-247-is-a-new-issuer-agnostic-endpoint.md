# 0001. 24/7 Prices are served by a new issuer-agnostic endpoint, separate from the 24/5 endpoints

Status: accepted
Date: 2026-11-03
Risk acceptance: accepted by Product (Gabe Silva) on 2026-11-04; Gabe owns the feed mapping tooling follow-up with Growth

## Context

Tokenized equity feeds need a 24/7 Price, optionally scaled by the Issuer Multiplier. The
upstream pipeline now does the blending and smoothing: a 24/7 module produces a blended,
smoothed price that the Asset DON publishes to data-engine as a v11 stream. The EA only has
to fetch that price, read the Issuer Multiplier on-chain, multiply, scale and return it.

The existing `coinbase`, `ondo`, `robinhood`, `xstocks` and `price` endpoints produce 24/5
Prices, carry their own session and smoothing logic, and back live feeds. Adding a 24/7 mode
to each of them would change code paths that live feeds depend on. More Issuers are
expected, so adding one should not need a new endpoint.

Originally recorded in the
[decision record doc](https://docs.google.com/document/d/1YaPG1bBRCF6Wni4IT8jQSRAFyntpLOngSH8nA03NuF4/edit?tab=t.0)
(endpoint then named `multiplied-247`), now superseded by these ADRs.

## Decision

Add one endpoint, `issuer-price-247`, for every Issuer. `multiplier.issuer` selects the
Issuer (robinhood, coinbase, ondo, xstocks); the Issuer-specific reads live in the shared
`src/issuers/` module.

- `multiplier` is optional. Without it the endpoint returns the 24/7 Price unscaled, so it
  also serves 24/7 feeds that are not tokenized assets.
- `resultPath` is limited to the report's price fields: `mid`, `bid`, `ask`,
  `lastTradedPrice`.
  - 24/5 endpoints use the `mid` whereas 24/7 endpoints use the `lastTradedPrice`.
- `targetEndpoint` only allows `v11`.
- The existing endpoints keep main's behavior unchanged.

Deliberate departures from the 24/5 path, not omissions:

- **No Market Status gate.** A 24/7 Price is priced around the clock, so there is no
  market-closed 503 and no stream selection by session.
- **No smoothing and no session boundaries.** Both happen upstream in the 24/7 module.

## Considered Options

Where the multiplication happens (an EA rather than on-chain, calculated streams, a contract
or CRE) is decided in [0005](./0005-issuer-multiplier-is-applied-in-an-ea.md). Given an EA:

- **A generic on-chain call spec in the request** (contract, method, args, chain): rejected;
  job specs become complex and error-prone, and pause and decimals handling cannot be
  standardised.
- **One endpoint per Issuer**, the existing pattern: rejected; duplicated code, and every new
  Issuer needs a new endpoint, transport and tests.
- **Reusing the 24/5 session and smoothing logic:** rejected; blending and smoothing now happen
  upstream.

## Consequences

- Zero blast radius on live 24/5 feeds: the 24/7 launch cannot regress them.
- Two code paths per Issuer (24/5 smoothed, 24/7 raw) that can drift. The shared
  `src/issuers/` module limits this to the pricing logic.
- Node operator job specs hard-code the endpoint name and payload shape, so the interface
  is hard to change once live.
- Intent, not commitment: the per-issuer endpoints may later converge onto `src/issuers/`.
  No date is set.

## Risks accepted

- **Feed mapping is not checked.** `feedId` and `multiplier.asset`
  are independent inputs, and nothing checks that they belong together. A job spec pairing an
  asset with another asset's feed returns a plausible wrong price with status 200. Every
  launch job spec's pairing must be validated before go-live. Owner: Product (Gabe Silva),
  coordinating with Growth to close the gap in the feed provisioning tooling, so that a mismatched
  `feedId` and `multiplier.asset` is caught before a job spec reaches node operators. Until
  then, pairings are checked by hand in RDD review. One case of the per-node-operator
  configuration risk in [0005](./0005-issuer-multiplier-is-applied-in-an-ea.md).
- **Ignored input is echoed back.** `multiplier.network` is required for Robinhood only.
  For other Issuers it is accepted, ignored and echoed in the response's
  `multiplier.network`; `registry` is likewise ignored for Robinhood and xStocks.
  Owner: engineering. Launch payloads omit `network` for non-Robinhood Issuers.
- Market Status, report staleness and report-value risks are covered in
  [0003](./0003-data-engine-reports-are-not-validated.md); pause handling in
  [0002](./0002-xstocks-ignores-asset-paused.md); multiplier reads in
  [0004](./0004-price-and-multiplier-are-read-independently.md).
