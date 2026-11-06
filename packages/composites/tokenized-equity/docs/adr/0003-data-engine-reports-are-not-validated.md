# 0003. Data-engine reports are not validated beyond resultPath, and request errors use framework handling

Status: accepted
Date: 2026-11-03
Risk acceptance: accepted by Product (Gabe Silva) on 2026-11-04

## Context

`issuer-price-247` gets the 24/7 Price from the data-engine EA over HTTP
(`DATA_ENGINE_ADAPTER_URL`) via the data-engine EA's `getDeutscheBoersePrice` helper. A
failed request is already handled upstream: the framework Requester retries once and
throws an `AdapterDataProviderError`, and the data-engine EA's `callEA` appends the
response body to the message. Validation of report values (price format, non-zero price,
decimals) was added and then reverted as not worth carrying.

## Decision

- No catch around the data-engine call; failed requests surface as the framework throws them.
- The only report check is that `resultPath` exists in the report (400 otherwise).
- No check of the price value, `decimals`, `lastSeenTimestampNs` or Market Status.
- Zero and negative prices are an accepted risk for launch. A guard is a fast follow, not a
  launch blocker.

## Consequences

- Every failed data-engine request (429, 400, 500, timeout, connection error) reaches
  callers as a **502**. The upstream status is only in the error message, so alerting
  cannot split on it; on-call reads the message. A 400 is retried once to no effect.
- A 200 response without `data` surfaces with the body's `statusCode`, or 500.

## Risks accepted

- **Zero or negative price returned as a 200 (highest severity).** A report whose
  `resultPath` field is `""`, `"0"` or negative scales to a zero or negative `result` with
  status 200, with or without a multiplier. It fails open: consumers may treat the asset as
  worthless. Accepted for launch, to be revisited as a fast follow: the minimal fix is a
  `result > 0` guard. Until then, mitigations are data-engine report guarantees and
  downstream deviation checks. Owner: Product.
- **Stale reports returned as a 200.** `maxAgeInSeconds` is not passed to the data-engine
  EA and `lastSeenTimestampNs` is not checked, so a stalled 24/7 stream keeps serving its
  last report. Response timestamps show the fetch time, not the observation time. Deferred
  to [DF-28181](https://smartcontract-it.atlassian.net/browse/DF-28181) (session-aware data
  filtering), which needs to cover `issuer-price-247` as well as the 24/5 endpoints.
  Owner: Product.
