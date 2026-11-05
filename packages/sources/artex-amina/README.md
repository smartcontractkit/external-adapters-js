# artex-amina

Chainlink external adapter for the ARTEX Proof of Reserve stream. AMINA Bank AG
is the custodian. The adapter reads the configured portfolio, selects the
configured ISIN, and publishes that position's raw share count as SmartData v9
`aum`.

## Endpoint

`por`

| Parameter     | Type   | Required | Description                                                                       |
| ------------- | ------ | -------- | --------------------------------------------------------------------------------- |
| `portfolioNo` | number | yes      | AMINA portfolio number. The API range is 100000000–999999999.                     |
| `isin`        | string | yes      | ISIN of the position to publish. The API pattern is `^[A-Z]{2}[A-Z0-9]{9}[0-9]$`. |

Example request:

```json
{
  "endpoint": "por",
  "portfolioNo": 157769305,
  "isin": "US0378331005"
}
```

## Environment

| Variable                 | Required | Description                                                                                           |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| `API_ENDPOINT`           | yes      | AMINA HTTPS host, for example `https://integration-test.aminagroup.io`. Do not include `/api/b2c/v1`. |
| `AMINA_USER_ID`          | yes      | AMINA 8-digit user ID.                                                                                |
| `AMINA_PASSWORD`         | yes      | AMINA password.                                                                                       |
| `AMINA_HMAC_SECRET`      | yes      | AMINA HMAC secret.                                                                                    |
| `AMINA_AGREEMENT_NUMBER` | yes      | AMINA agreement number.                                                                               |
| `AMINA_USER_AGENT`       | no       | User-Agent header. Default: `chainlink-artex-amina-adapter/1.0.0`.                                    |
| `BACKGROUND_EXECUTE_MS`  | no       | Idle background sleep. Active cache entries are checked every 100 ms. Default: 1000.                  |
| `MAX_ATTEMPTS`           | no       | Maximum attempts for a retryable request. Default: 3.                                                 |
| `RETRY_BASE_DELAY_MS`    | no       | Base retry delay. Default: 2000.                                                                      |
| `RETRY_MAX_DELAY_MS`     | no       | Maximum retry delay. Default: 40000.                                                                  |
| `ERROR_CACHE_TTL_MS`     | no       | How long a failed response stays cached before a retry. Default: 60000.                               |

## Behaviour

- Login and refresh use `POST /api/b2c/v1/auth` without HMAC headers.
- Every positions GET uses a Bearer token and a fresh HMAC nonce, timestamp,
  URI, signature, agreement header, and request IDs.
- The access token is reused until it expires. A 401 refreshes the token, then
  falls back to a full login. The adapter retries the page once.
- Pagination starts at page 0 with size 20 and follows `last` and `totalPages`
  until the final page. It scans every page before selecting the ISIN.
- A missing ISIN, duplicate ISIN, malformed position, malformed page, or
  exhausted retry returns 502 and writes no report.
- Retryable errors are network errors, 429, and 5xx. The adapter uses
  exponential backoff capped at 40 seconds for auth and positions. 400, 401,
  and 403 are not retried; a positions 401 gets one token refresh. A failed
  response is cached for `ERROR_CACHE_TTL_MS` before a background retry.
- The response `aum` is the raw source quantity. The adapter does not scale or
  round it. The stream configuration owns `decimals`.
- `validFrom`/`observations` use the first positions GET time. The adapter sets
  `providerIndicatedTimeUnixMs` to that time.
- `ripcord` is always 0. `navPerShare`, `navDate`, `nativeFee`, and `linkFee`
  are returned as 0. `feedId`, `expiresAt`, and `decimals` are stream
  configuration fields.

## Semantics

The requirement reuses the v9 `aum` field for the ARTEX share count because v9
has no quantity field. The v9 schema labels `aum` as USD AUM. The ARTEX
consumer must read this stream as a share count. The owner-approved waiver W-1
records the 4-decimal stream encoding (scale 10^4).

## Commands

```bash
yarn workspace @chainlink/artex-amina-adapter build
yarn test packages/sources/artex-amina
```
