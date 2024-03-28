# COINBASE-PRIME

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinbase-prime/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |               Description               |  Type  | Options |             Default              |
| :-------: | :----------: | :-------------------------------------: | :----: | :-----: | :------------------------------: |
|           | API_ENDPOINT |   The HTTP URL to retrieve data from    | string |         | `https://api.prime.coinbase.com` |
|    ✅     |  ACCESS_KEY  |   The API key for Coinbase Prime auth   | string |         |                                  |
|    ✅     |  PASSPHRASE  | The passphrase for Coinbase Prime auth  | string |         |                                  |
|    ✅     | SIGNING_KEY  | The signing key for Coinbase Prime auth | string |         |                                  |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                                                   Note                                                                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------------------------------------------------------------------------------------------------------------------: |
| default |             25              |                             |                           | Using the most restrictive rate limit. Docs: IP address at 100 requests per second (rps). Portfolio ID at 25 rps with a burst of 50 rps. |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |               Description                |  Type  |           Options           | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :--------------------------------------: | :----: | :-------------------------: | :-----: | :--------: | :------------: |
|    ✅     | portfolio |         | The portfolio ID to query the balance of | string |                             |         |            |                |
|    ✅     |  symbol   |         |   The symbol to return the balance for   | string |                             |         |            |                |
|           |   type    |         |        The balance type to return        | string | `total`, `trading`, `vault` | `total` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "portfolio": "abcd1234-123a-1234-ab12-12a34bcd56e7",
    "symbol": "BTC",
    "type": "total"
  }
}
```

---

MIT License
