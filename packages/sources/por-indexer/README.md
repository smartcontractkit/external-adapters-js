# POR_INDEXER

![2.0.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/por-indexer/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |               Name               |                                        Description                                        |  Type  | Options | Default |
| :-------: | :------------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           | BITCOIN_MAINNET_POR_INDEXER_URL  |                              Indexer URL for Bitcoin mainnet                              | string |         |   ``    |
|           | BITCOIN_TESTNET_POR_INDEXER_URL  |                              Indexer URL for Bitcoin testnet                              | string |         |   ``    |
|           | DOGECOIN_MAINNET_POR_INDEXER_URL |                             Indexer URL for Dogecoin mainnet                              | string |         |   ``    |
|           | DOGECOIN_TESTNET_POR_INDEXER_URL |                             Indexer URL for Dogecoin testnet                              | string |         |   ``    |
|           |      BACKGROUND_EXECUTE_MS       | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                         Options                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [index](#balance-endpoint) | `balance` |

## Balance Endpoint

Supported names for this endpoint are: `balance`, `index`.

### Input Params

| Required? |       Name        | Aliases  |                                             Description                                              |   Type   |        Options        | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :------: | :--------------------------------------------------------------------------------------------------: | :------: | :-------------------: | :-----: | :--------: | :------------: |
|    ✅     |     addresses     | `result` |  An array of addresses to get the balances of (as an object with string `address` as an attribute)   | object[] |                       |         |            |                |
|    ✅     | addresses.address |          |                                   an address to get the balance of                                   |  string  |                       |         |            |                |
|    ✅     | addresses.network |          |                               The name of the target network protocol                                |  string  | `bitcoin`, `dogecoin` |         |            |                |
|    ✅     | addresses.chainId |          |                                     The name of the target chain                                     |  string  | `mainnet`, `testnet`  |         |            |                |
|           | minConfirmations  |          | Number of blocks that must have been confirmed after the point against which the balance is checked. |  number  |                       |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "bc1qlh50jpjrrlcuy6sslrucksjg22h6e0d65ken6sc54exfkrln932snwg523",
        "chainId": "mainnet",
        "network": "bitcoin"
      }
    ],
    "minConfirmations": 0
  }
}
```

---

MIT License
