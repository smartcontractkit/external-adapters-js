# Chainlink External Adapter for AlphaVantage

Use this adapter for connecting to [AlphaVantage's API](https://www.alphavantage.co/documentation/) from a Chainlink node.

### Environment Variables

| Required? |  Name   |                                        Description                                        | Options | Defaults to |
| :-------: | :-----: | :---------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://www.alphavantage.co/support/#api-key) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

Returns the exchange rate from a currency's current price to a given currency

### Input Params

| Required? |            Name            |                        Description                        |                                                                          Options                                                                           | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            | [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/) |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          | [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/) |             |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used |                                    [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json)                                    |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "Realtime Currency Exchange Rate": {
      "1. From_Currency Code": "ETH",
      "2. From_Currency Name": "Ethereum",
      "3. To_Currency Code": "USD",
      "4. To_Currency Name": "United States Dollar",
      "5. Exchange Rate": "170.88000000",
      "6. Last Refreshed": "2020-04-16 19:15:01",
      "7. Time Zone": "UTC",
      "8. Bid Price": "170.84000000",
      "9. Ask Price": "170.88000000"
    },
    "result": 170.88
  },
  "result": 170.88,
  "statusCode": 200
}
```
