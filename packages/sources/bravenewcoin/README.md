# Chainlink External Adapter for BraveNewCoin

![1.2.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bravenewcoin/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name    | Description |  Type  | Options | Default |
| :-------: | :-------: | :---------: | :----: | :-----: | :-----: |
|    ✅     |  API_KEY  |             | string |         |         |
|    ✅     | CLIENT_ID |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                    Options                                    | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [price](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

[BraveNewCoin's AssetTicker endpoint](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_836afc6

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "BTC"
  },
  "debug": {
    "cacheKey": "Eao0YPhZDa3+RmRxiwOG5dAIIt0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 0.06453350218072039
  },
  "result": 0.06453350218072039,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Vwap Endpoint

[BraveNewCoin's 24 Hour USD VWAP](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_8b8774ba-b368-4399-9c4a-dc78f13fc786)

`vwap` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |                        Aliases                        |                                                                          Description                                                                          |  Type  |   Options    | Default | Depends On | Not Valid With |
| :-------: | :-------: | :---------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :----------: | :-----: | :--------: | :------------: |
|    ✅     |  symbol   | `asset`, `assetId`, `base`, `coin`, `from`, `indexId` |                                                      Retrieve the VWAP for a particular asset or market                                                       | string |              |         |            |                |
|           | indexType |                                                       |                                                         Restrict the OHLCV results to the index type.                                                         | string | `GWA`, `MWA` |         |            |                |
|           | timestamp |                                                       | Retrieve the daily OHLCV record from before the timestamp provided. All dates are stored in UTC. Timestamp strings should be in the form YYYY-MM-DDThh:mm:ssZ |        |              |         |            |                |

### Example

Request:

```json
{
  "id": "2",
  "data": {
    "endpoint": "vwap",
    "symbol": "ETH"
  },
  "debug": {
    "cacheKey": "YqvNVLXR2frUT84tqjjAR+vz/BU="
  }
}
```

Response:

```json
{
  "jobRunID": "2",
  "data": {
    "content": [
      {
        "indexId": "e991ba77-d384-48ff-b0a4-40e95ef6b7d6",
        "indexType": "GWA",
        "open": 3872.444353468022,
        "high": 4148.839979992307,
        "low": 3830.078382818216,
        "close": 4137.589066216359,
        "volume": 3373487.6142539503,
        "vwap": 3969.76725876602,
        "twap": 3957.582228402148,
        "startTimestamp": "2021-10-20T00:00:00Z",
        "endTimestamp": "2021-10-20T23:59:59.999Z",
        "timestamp": "2021-10-20T00:00:00Z",
        "id": "735b94df-008c-4fc3-a50c-af0f2e0b25c4"
      }
    ],
    "nextId": "735b94df-008c-4fc3-a50c-af0f2e0b25c4",
    "result": 3969.76725876602
  },
  "result": 3969.76725876602,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
