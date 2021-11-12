# Chainlink External Adapter for dxFeed

### Environment Variables

| Required? |     Name     |         Description          | Options |                Defaults to                 |
| :-------: | :----------: | :--------------------------: | :-----: | :----------------------------------------: |
|    ✅     | API_USERNAME |                              |         |                                            |
|    ✅     | API_PASSWORD |                              |         |                                            |
|           | API_ENDPOINT | The endpoint for your dxFeed |         | `https://tools.dxfeed.com/webservice/rest` |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |               Name               |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` |            The symbol of the currency to query            |                                                                                      |             |
|    🟡     |           `overrides`            | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

You may search for relevant symbols using the [Symbol Lookup Tool](https://symbol-lookup.dxfeed.com/) and map them using `overrides`. You can confirm validity of symbols with the [REST Services Demo Tool](https://tools.dxfeed.com/webservice/rest-demo.jsp).

### Sample Input

```json
{
  "id": 1,
  "data": {
    "base": "FTSE"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": "OK",
    "Trade": {
      "UKX:FTSE": {
        "eventSymbol": "UKX:FTSE",
        "eventTime": 0,
        "time": 1593001772000,
        "timeNanoPart": 0,
        "sequence": 115972,
        "exchangeCode": "",
        "price": 6194.63,
        "size": 0,
        "dayVolume": 0,
        "dayTurnover": "NaN",
        "tickDirection": "ZERO_UP",
        "extendedTradingHours": false
      }
    },
    "result": 6194.63
  },
  "result": 6194.63,
  "statusCode": 200
}
```
