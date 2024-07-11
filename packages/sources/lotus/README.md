# LOTUS

![3.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/lotus/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                            Description                                             |  Type  | Options | Default |
| :-------: | :-------------------: | :------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        API_KEY        | Your Lotus node [API key/token](https://docs.filecoin.io/build/lotus/api-tokens/#obtaining-tokens) | string |         |         |
|    ✅     |   FILECOIN_RPC_URL    |                                      RPC URL of Filecoin node                                      | string |         |         |
|           | BACKGROUND_EXECUTE_MS |     The amount of time the background execute should sleep before performing the next request      | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                  Options                                  |  Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [filecoin.walletbalance](#balance-endpoint) | `balance` |

## Balance Endpoint

Supported names for this endpoint are: `balance`, `filecoin.walletbalance`.

### Input Params

| Required? |       Name        | Aliases  |                                            Description                                            |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :------: | :-----------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     addresses     | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | object[] |         |         |            |                |
|    ✅     | addresses.address |          |                                 an address to get the balance of                                  |  string  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi"
      },
      {
        "address": "f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay"
      }
    ]
  }
}
```

---

MIT License
