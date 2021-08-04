# Chainlink External Adapter for dxFeed

### Environment Variables

| Required? |          Name           |               Description               | Options |                Defaults to                 |
| :-------: | :---------------------: | :-------------------------------------: | :-----: | :----------------------------------------: |
|    ✅     |      API_USERNAME       |                                         |         |                                            |
|    ✅     |      API_PASSWORD       |                                         |         |                                            |
|           |      API_ENDPOINT       |      The endpoint for your dxFeed       |         | `https://tools.dxfeed.com/webservice/rest` |
|    ✅     | RADAR_SAAS_API_ENDPOINT | The endpoint for your dxFeed Radar SaaS |         |                                            |

---

### Input Parameters

| Required? |   Name   |     Description     |                       Options                        | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [atm-iv](#ATM-IV-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |               Name               |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` |            The symbol of the currency to query            |                                                                                      |             |
|    🟡     |           `overrides`            | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

`overrides` should contain the following symbol conversions:

```bash
N225 ➡️ 'NKY.IND:TEI'
FTSE ➡️ 'UKX.IND:TEI'
TSLA ➡️ 'TSLA:BFX'
TSLAX ➡️ 'TSLA.US:TEI'
```

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

## ATM IV Endpoint

At-the-money implied volatility

### Input Params

| Required? |   Name    |             Description             |    Options    | Defaults to |
| :-------: | :-------: | :---------------------------------: | :-----------: | :---------: |
|    ✅     | `symbol`  | The symbol of the currency to query | `BTC`, `ETH`, |             |
|    ✅     | `daysOut` |         Days until maturity         |               |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "BTC",
    "daysOut": 10
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "outputNames": ["atmIv(daysToExp=10)"],
    "entries": [
      {
        "symbol": "BTCUSD:CXXDRB",
        "outputs": [0.7259234133485732]
      }
    ],
    "result": 0.7259234133485732
  },
  "result": 0.7259234133485732,
  "statusCode": 200
}
```
