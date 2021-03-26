# Chainlink External Adapter for dxFeed

An adapter to add secondary mapping for symbols:

```bash
TSLA ➡️ 'TSLA.US:TEI'
```

### Environment Variables

| Required? |     Name     |         Description          | Options |                Defaults to                 |
| :-------: | :----------: | :--------------------------: | :-----: | :----------------------------------------: |
|    ✅     | API_USERNAME |                              |         |                                            |
|    ✅     | API_PASSWORD |                              |         |                                            |
|    🟡     | API_ENDPOINT | The endpoint for your dxFeed |         | `https://tools.dxfeed.com/webservice/rest` |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |               Name               |             Description             | Options | Defaults to |
| :-------: | :------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` | The symbol of the currency to query |         |             |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../presetSymbols.json)|             |

`overrides` should contain the following symbol conversions:

```bash
N225: 'NKY.IND:TEI',
FTSE: 'UKX.IND:TEI',
TSLA: 'TSLA.US:TEI',
```

## Output

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
