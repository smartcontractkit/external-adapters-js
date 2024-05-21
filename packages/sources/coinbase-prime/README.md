# COINBASE_PRIME

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinbase-prime/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |             Default              |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------: |
|           |     API_ENDPOINT      |                            The HTTP URL to retrieve data from                             | string |         | `https://api.prime.coinbase.com` |
|    ✅     |      ACCESS_KEY       |                            The API key for Coinbase Prime auth                            | string |         |                                  |
|    ✅     |      PASSPHRASE       |                          The passphrase for Coinbase Prime auth                           | string |         |                                  |
|    ✅     |      SIGNING_KEY      |                          The signing key for Coinbase Prime auth                          | string |         |                                  |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |             `10000`              |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                                                   Note                                                                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------------------------------------------------------------------------------------------------------------------: |
| default |             25              |                             |                           | Using the most restrictive rate limit. Docs: IP address at 100 requests per second (rps). Portfolio ID at 25 rps with a burst of 50 rps. |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                         Options                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [wallet](#wallet-endpoint) | `balance` |

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

## Wallet Endpoint

`wallet` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                Description                 |   Type   |                     Options                     |  Default  | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :----------------------------------------: | :------: | :---------------------------------------------: | :-------: | :--------: | :------------: |
|    ✅     | portfolio |         |  The portfolio ID to query the balance of  |  string  |                                                 |           |            |                |
|    ✅     |  symbols  |         |    The symbol to return the balance for    | string[] |                                                 |           |            |                |
|           |   type    |         |         The balance type to return         |  string  | `trading`, `vault`, `wallet_type_other`, `web3` |  `vault`  |            |                |
|           |  chainId  |         |       The ID of the chain to return        |  string  |              `mainnet`, `testnet`               | `mainnet` |            |                |
|           |  network  |         |           The network to return            |  string  |                                                 | `bitcoin` |            |                |
|           | batchSize |         | The number of addresses to fetch at a time |  number  |                                                 |   `100`   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "wallet",
    "portfolio": "abcd1234-123a-1234-ab12-12a34bcd56e7",
    "symbols": ["BTC"],
    "type": "vault",
    "chainId": "mainnet",
    "network": "bitcoin",
    "batchSize": 10
  }
}
```

---

MIT License
