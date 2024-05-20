# Chainlink External Adapters to query RenVM address set

![1.5.72](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/renvm-address-set/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |  Default  |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------: |
|    ✅     | API_ENDPOINT |             | string |         |           |
|           |   NETWORK    |             | string |         | `testnet` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

`address` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                                       Description                                        | Type | Options |  Default  | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :--------------------------------------------------------------------------------------: | :--: | :-----: | :-------: | :--------: | :------------: |
|           |     network     |         | specify what RenVM network you are talking to. Options: `mainnet`, `chaosnet`, `testnet` |      |         | `testnet` |            |                |
|           |     chainId     |         |                                                                                          |      |         |           |            |                |
|           | tokenOrContract |         |                        token or contract to return an address for                        |      |         |           |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "network": "testnet",
    "tokenOrContract": "btc",
    "endpoint": "address"
  },
  "debug": {
    "cacheKey": "GmO7zrjuwJ1pbYY0e4npsh2kUD0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "address": "mytu3FGw8cTzGTBTQZoVcZ2CZaYpRdk2YA",
        "coin": "btc",
        "network": "bitcoin",
        "chainId": "testnet"
      }
    ]
  },
  "result": [
    {
      "address": "mytu3FGw8cTzGTBTQZoVcZ2CZaYpRdk2YA",
      "coin": "btc",
      "network": "bitcoin",
      "chainId": "testnet"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
