# Chainlink External Adapter for AlphaVantage

![1.1.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/alphavantage/package.json)

Use this adapter for connecting to [AlphaVantage's API](https://www.alphavantage.co/documentation/) from a Chainlink node.

Base URL https://www.alphavantage.co/query

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                        Description                                        |  Type  | Options |               Default               |
| :-------: | :----------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           | API_ENDPOINT |                                                                                           | string |         | `https://www.alphavantage.co/query` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://www.alphavantage.co/support/#api-key) | string |         |                                     |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [price](#forex-endpoint) | `forex` |

## Forex Endpoint

Returns the exchange rate from a currency's current price to a given currency.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.**"

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                                                                                                                   Description                                                                                                                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/) | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "base": "GBP",
    "quote": "USD"
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
