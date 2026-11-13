# ARTEX_AMINA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/artex-amina/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Behaviour

- Login and refresh use `POST /api/b2c/v1/auth` without HMAC headers.
- Every positions GET uses a Bearer token and a fresh HMAC nonce, timestamp,
  URI, signature, agreement header, and request IDs.
- The access token is reused until it expires. A 401 refreshes the token once
  and retries the page; if the refresh request itself fails, it falls back to a
  full login. Transient auth/positions failures use exponential backoff
  (3 attempts, 2 second base, 40 second cap).
- `portfolioNo` must be an integer between 100000000 and 999999999 and `isin`
  must be a valid ISO 6166 ISIN; otherwise the EA returns 400 before calling
  the provider.
- Pagination starts at page 0 with size 2000 (the AMINA maximum), follows
  `last` and `totalPages`, and caps at 100 pages. It scans every page before
  selecting the ISIN.
- A missing ISIN, duplicate ISIN, malformed position, malformed page, or
  exhausted retry returns 502 and writes no report. If a live report is
  already cached, a failed scan is suppressed and the previous report remains
  until `expiresAt`.
- A timed-out background execute is not cancelled by the framework. The
  transport shares an in-flight scan for the same cache key and refuses to
  overwrite a newer snapshot with an older one.
- The first request after a cold start may return 504 while the background
  scan fills the cache. The consumer should retry; subsequent requests are
  served from the cache.
- Retryable errors are network errors, 429, and 5xx. The adapter uses
  exponential backoff capped at 40 seconds for auth and positions. 400, 401,
  and 403 are not retried; a positions 401 gets one token refresh. Failed
  responses use the framework cache age before the next background attempt.
- The adapter does not impose a rate limit; AMINA documents no read-only
  limit, so the framework defaults apply.
- Runtime access and refresh tokens are registered with the framework log
  censor. If trace logs are collected, set `CENSOR_SENSITIVE_LOGS=true`: the
  per-request HMAC signature and nonce are still present in trace output.
- The framework `RETRY` setting must be 0; the adapter rejects a nonzero value
  at startup because framework retries replay the signed nonce.
- Run with the framework default `EA_MODE=reader-writer`; `reader` mode disables
  the background executor this subscription transport needs.
- The response `aum` is the raw source quantity. The adapter does not scale or
  round it. The stream configuration owns `decimals`. A quantity above
  `Number.MAX_SAFE_INTEGER / 10000` (about 9.007e11, the largest 4-decimal
  value a JavaScript number represents exactly) is rejected as malformed; this
  is a JavaScript limit, not an AMINA limit. Expected ARTEX share counts are
  far below it.
- `validFrom`/`observations` use the first positions GET time. The adapter sets
  `providerIndicatedTimeUnixMs` to that time.
- `ripcord` is always `false` for feeds routing; the v9 `ripcord` value is
  `ripcordAsInt: 0`. `navPerShare`, `navDate`, `nativeFee`, and `linkFee`
  are returned as 0. `feedId`, `expiresAt`, and `decimals` are stream
  configuration fields.

## Semantics

The requirement reuses the v9 `aum` field for the ARTEX share count because v9
has no quantity field. The v9 schema labels `aum` as USD AUM. The ARTEX
consumer must read this stream as a share count; the stream applies the
4-decimal scale.

## Commands

```bash
yarn workspace @chainlink/artex-amina-adapter build
yarn test packages/sources/artex-amina
```

## Environment Variables

| Required? |           Name           |                             Description                              |  Type  | Options |               Default               |
| :-------: | :----------------------: | :------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           |      `API_ENDPOINT`      | AMINA host or OpenAPI server URL; a trailing /api/b2c/v1 is stripped | string |         | `https://integration.aminagroup.io` |
|    ✅     |     `AMINA_USER_ID`      |                        8-digit AMINA user ID                         | string |         |                                     |
|    ✅     |     `AMINA_PASSWORD`     |                               password                               | string |         |                                     |
|    ✅     |   `AMINA_HMAC_SECRET`    |                             HMAC secret                              | string |         |                                     |
|    ✅     | `AMINA_AGREEMENT_NUMBER` |                           agreement number                           | string |         |                                     |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [por](#por-endpoint) |  `por`  |

## Por Endpoint

`por` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |   Description    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :--------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | portfolioNo |         | portfolio number | number |         |         |            |                |
|    ✅     |    isin     |         |       ISIN       | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "por",
    "portfolioNo": 157769305,
    "isin": "US0378331005"
  }
}
```

---

MIT License
