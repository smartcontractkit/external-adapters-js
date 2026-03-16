# DF-22956: Case Normalization Rollout Guide

## Overview

The `@chainlink/external-adapter-framework` now includes `NORMALIZE_CASE_INPUTS` (default: `true`),
which normalizes `base` and `quote` parameters to uppercase before cache key computation and
subscription registration. This prevents WebSocket subscription churn when the same asset is
requested with different casings (e.g. `USDe/USD` vs `USDE/USD`).

## Rollout Steps

### Step 1: Framework Release

Merge and release `ea-framework-js` branch `feature/DF-22956/normalize-case-inputs`.

### Step 2: Canary (blocksize-capital)

1. Bump `@chainlink/external-adapter-framework` in `packages/sources/blocksize-capital/package.json`
2. Run integration tests: `yarn test` in `packages/sources/blocksize-capital`
3. Deploy to staging, verify with `USDe/USD` + `USDE/USD` scenario
4. Deploy to production, monitor 2-3 days

### Step 3: Batch A (lower risk)

Bump framework version in:

- allium-state
- twosigma
- expand-network
- tp
- icap

Deploy, soak 1-2 days.

### Step 4: Batch B (medium risk)

Bump framework version in:

- finage
- coinpaprika
- coinmetrics
- dxfeed
- gsr

Deploy, soak 1-2 days.

### Step 5: Batch C (higher risk)

Bump framework version in:

- tradermade
- finalto
- elwood
- mobula-state (funding-rate)

Deploy, soak 1-2 days.

## Adapters Requiring NORMALIZE_CASE_INPUTS=false

These adapters use `toLowerCase()` for their DP API and should opt out:

- **tiingo**: Add `envDefaultOverrides: { NORMALIZE_CASE_INPUTS: false }` to config
- **tiingo-state**: Same as tiingo

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

## Rollback

Set `NORMALIZE_CASE_INPUTS=false` via env var on any affected EA instance (instant, no redeploy).
