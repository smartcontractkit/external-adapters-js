# artex-amina

Chainlink external adapter for the ARTEX Proof of Reserve stream. AMINA Bank AG
is the custodian. The adapter reads the configured portfolio, selects the
configured ISIN, and publishes that position's raw share count as SmartData v9
`aum`.

## Endpoint

`por`

| Parameter     | Type   | Required | Description       |
| ------------- | ------ | -------- | ----------------- |
| `portfolioNo` | number | yes      | portfolio number. |
| `isin`        | string | yes      | ISIN.             |

Example request:

```json
{
  "endpoint": "por",
  "portfolioNo": 157769305,
  "isin": "US0378331005"
}
```

## Environment

| Variable                 | Required | Description       |
| ------------------------ | -------- | ----------------- |
| `API_ENDPOINT`           | yes      | api endpoint.     |
| `AMINA_USER_ID`          | yes      | user ID.          |
| `AMINA_PASSWORD`         | yes      | password.         |
| `AMINA_HMAC_SECRET`      | yes      | HMAC secret.      |
| `AMINA_AGREEMENT_NUMBER` | yes      | agreement number. |

The adapter keeps the retry limits (3 attempts, 2 second base delay, 40 second
cap) and the user-agent as code constants. Cache and subscription TTLs are
capped at 1 hour; the background execute timeout is 300 seconds to cover the
retry budget. The required envs are the five AMINA connection values above.

## Behaviour

- Login and refresh use `POST /api/b2c/v1/auth` without HMAC headers.
- Every positions GET uses a Bearer token and a fresh HMAC nonce, timestamp,
  URI, signature, agreement header, and request IDs.
- The access token is reused until it expires. A 401 refreshes the token once
  and retries the page; if the refresh request itself fails, it falls back to a
  full login. Transient auth/positions failures use exponential backoff
  (3 attempts, 2 second base, 40 second cap).
- `portfolioNo` must be an integer between 100000000 and 999999999 and `isin`
  must match `^[A-Z]{2}[A-Z0-9]{9}[0-9]$`; otherwise the EA returns 400 before
  calling the provider.
- Pagination starts at page 0 with size 2000 (the AMINA maximum), follows
  `last` and `totalPages`, and caps at 100 pages. It scans every page before
  selecting the ISIN.
- A missing ISIN, duplicate ISIN, malformed position, malformed page, or
  exhausted retry returns 502 and writes no report.
- Retryable errors are network errors, 429, and 5xx. The adapter uses
  exponential backoff capped at 40 seconds for auth and positions. 400, 401,
  and 403 are not retried; a positions 401 gets one token refresh. Failed
  responses use the framework cache age before the next background attempt.
- The adapter does not impose a rate limit; AMINA documents no read-only
  limit, so the framework defaults apply.
- The framework `RETRY` setting must be 0; the adapter rejects a nonzero value
  at startup because framework retries replay the signed nonce.
- Run with the framework default `EA_MODE=reader-writer`; `reader` mode disables
  the background executor this subscription transport needs.
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
consumer must read this stream as a share count; the stream applies the
4-decimal scale.

## Commands

```bash
yarn workspace @chainlink/artex-amina-adapter build
yarn test packages/sources/artex-amina
```
