# Cryptex Adapter

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptex/package.json)

Cryptex adapter, providing BTC dominance over the total crypto market

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |                                              Description                                              |  Type  | Options | Default |
| :-------: | :--------------: | :---------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL | An http(s) RPC URL to a blockchain node that can read the BTC market cap & total market cap contracts | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                   Options                                    |     Default     |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [btc-dominance](#btcdominance-endpoint), [dominance](#btcdominance-endpoint) | `btc-dominance` |

## Btcdominance Endpoint

Endpoint to calculate BTC dominance

Supported names for this endpoint are: `btc-dominance`, `dominance`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "btc-dominance"
  },
  "debug": {
    "cacheKey": "pNufeTfzjBR4afsgETdEgOf2EpE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "btcDominance": "0.435918142911669111",
    "result": "0.435918142911669111"
  },
  "result": "0.435918142911669111",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
