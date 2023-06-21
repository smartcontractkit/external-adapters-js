# ALPHAVANTAGE

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/alphavantage/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                        Description                                        |  Type  | Options |               Default               |
| :-------: | :----------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           | API_ENDPOINT |                            The HTTP URL to retrieve data from                             | string |         | `https://www.alphavantage.co/query` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://www.alphavantage.co/support/#api-key) | string |         |                                     |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [price](#forex-endpoint) | `forex` |

## Forex Endpoint

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "GBP",
    "quote": "USD",
    "endpoint": "forex"
  },
  "debug": {
    "cacheKey": "nNGTBPQMuNeDIBcqHmoSuDeMaVw="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "Realtime Currency Exchange Rate": {
      "1. From_Currency Code": "GBP",
      "2. From_Currency Name": "British Pound Sterling",
      "3. To_Currency Code": "USD",
      "4. To_Currency Name": "United States Dollar",
      "5. Exchange Rate": "1.36606000",
      "6. Last Refreshed": "2021-11-01 19:33:43",
      "7. Time Zone": "UTC",
      "8. Bid Price": "1.36602600",
      "9. Ask Price": "1.36612700"
    },
    "result": 1.36606
  },
  "result": 1.36606,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
