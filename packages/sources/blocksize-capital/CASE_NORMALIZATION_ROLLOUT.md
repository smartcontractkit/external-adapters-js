# DF-22956: Case Normalization Rollout Guide

## Overview

The `@chainlink/external-adapter-framework` now includes `NORMALIZE_CASE_INPUTS` (default: `true`),
which normalizes `base` and `quote` parameters to uppercase before cache key computation and
subscription registration. This prevents WebSocket subscription churn when the same asset is
requested with different casings (e.g. `USDe/USD` vs `USDE/USD`).

## Bug Fix: tiingo / tiingo-state broken requestTransform

Both `tiingo` and `tiingo-state` had a `tiingoCommonSubscriptionRequestTransform` that was intended
to lowercase `base` and `quote`. However, it was written as a factory function that **returned** a
transform without executing it, making it a no-op:

```typescript
// BUG: framework calls this with (req, settings), outer function ignores both,
// returns an inner function that is never invoked (return value discarded).
export function tiingoCommonSubscriptionRequestTransform() {
  return (req) => {
    req.requestContext.data.base = req.requestContext.data.base.toLowerCase() // never runs
  }
}
```

This means tiingo/tiingo-state have **never** been lowercasing inputs at the subscription level.
The Tiingo WS `subscribeMessage` builder independently lowercases the ticker in `wsMessageContent`,
so the DP API received correct data, but subscription deduplication was broken.

**Fix**: The broken factory function has been replaced with an empty stub (backward-compatible).
Framework-level `NORMALIZE_CASE_INPUTS=true` (the default) now handles normalization. No
`envDefaultOverrides` opt-out is needed for tiingo or tiingo-state.

## Full EA Audit Results

### No adapter requires NORMALIZE_CASE_INPUTS=false

Every EA was audited. None require case-sensitive `base`/`quote` identifiers from the framework.
Adapters that use non-base/quote params (e.g. `symbol`, `index`, `market`) are unaffected since the
framework only normalizes `base` and `quote`.

### Adapters with existing uppercase transforms (redundant but safe)

These already uppercase `base`/`quote` in their own `requestTransforms`. The framework normalization
is redundant but does not conflict:

- ncfx (forex, crypto, crypto-lwba, forex-continuous)
- cryptocompare (crypto)
- finnhub (quote)
- coinpaprika-state
- kaiko-state
- mobula-state (price)

### Adapters with no base/quote transforms (framework normalization helps)

- blocksize-capital, blocksize-capital-state
- tradermade, elwood, expand-network, finalto
- dxfeed, oanda, allium-state
- coinmetrics (HTTP only)
- finage (crypto endpoint; forex has custom inverse-pair logic)

### Adapters not affected (don't use base/quote)

- wintermute (uses `symbol`)
- cfbenchmarks (uses `index`)
- tp (uses `streamName`)
- coinpaprika markprice (uses `symbol`)
- tradinghours (uses `market`)

## Rollout Steps

### Step 1: Framework Release

Merge and release `ea-framework-js` branch `feature/DF-22956/normalize-case-inputs`.

### Step 2: Canary (blocksize-capital)

1. Bump `@chainlink/external-adapter-framework` in `packages/sources/blocksize-capital/package.json`
2. Run integration tests: `yarn test` in `packages/sources/blocksize-capital`
3. Deploy to staging, verify with `USDe/USD` + `USDE/USD` scenario
4. Deploy to production, monitor 2-3 days

### Step 3: tiingo + tiingo-state (high priority)

These are actively affected by the broken transform bug. Deploy immediately after canary validation.

1. Bump framework version in `tiingo` and `tiingo-state`
2. Verify broken `tiingoCommonSubscriptionRequestTransform` stub is in place
3. Deploy to staging, verify `USDe/USD` + `USDE/USD` deduplication
4. Deploy to production, monitor 2-3 days

### Step 4: Batch A (lower risk)

Bump framework version in:

- allium-state
- twosigma
- expand-network
- tp
- icap

Deploy, soak 1-2 days.

### Step 5: Batch B (medium risk)

Bump framework version in:

- finage
- coinpaprika
- coinmetrics
- dxfeed
- gsr

Deploy, soak 1-2 days.

### Step 6: Batch C (higher risk)

Bump framework version in:

- tradermade
- finalto
- elwood
- mobula-state (funding-rate)

Deploy, soak 1-2 days.

## Optional Cleanup (Follow-up PR)

Remove redundant `toUpperCase()` requestTransforms from adapters that now get normalization
from the framework:

- ncfx (4 endpoints)
- mobula-state (price endpoint)
- kaiko-state
- cryptocompare
- coinpaprika-state
- finnhub (partial - keep exchange normalization)
- finage (partial - keep pair inversion logic)
- coinmarketcap (partial - keep cid/resultPath logic)

Remove the deprecated `tiingoCommonSubscriptionRequestTransform` stub from tiingo and tiingo-state.

## Rollback

Set `NORMALIZE_CASE_INPUTS=false` via env var on any affected EA instance (instant, no redeploy).
