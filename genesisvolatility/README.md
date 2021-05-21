# Chainlink External Adapter for Geneseis Volatility

### Environment Variables

| Required? |  Name   |                                Description                                 | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://genesisvolatility.io/) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                  Options                                  |   Defaults to   |
| :-------: | :------: | :-----------------: | :-----------------------------------------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | [delta-skew-3020](#30/20-Delta-Skew-Endpoint), [atm-iv](#ATM-IV-Endpoint) | delta-skew-3020 |

---

## 30/20 Delta Skew Endpoint

30 day, constant maturity, 30/20 delta skew

### Input Params

| Required? |   Name   |             Description             |    Options    | Defaults to |
| :-------: | :------: | :---------------------------------: | :-----------: | :---------: |
|    ✅     | `symbol` | The symbol of the currency to query | `BTC`, `ETH`, |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "ETH"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "data": { "LinkPool3020Skew": [{ "twentyfiveDeltaSkew30Day": 1.48 }] },
    "result": 1.48
  },
  "statusCode": 200
}
```

## ATM IV Endpoint

At-the-money implied volatility

### Input Params

| Required? |   Name   |             Description             |                                   Options                                   | Defaults to |
| :-------: | :------: | :---------------------------------: | :-------------------------------------------------------------------------: | :---------: |
|    ✅     | `symbol` | The symbol of the currency to query |                                `BTC`, `ETH`,                                |             |
|    ✅     |  `day`   |     The number of days to query     | `tenDayIv`,`thirtyDayIv`, `sixtyDayIv`,`nintyDayIv`,`oneHundredeightyDayIv` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "ETH",
    "day": "tenDayIv"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "data": {
      "LinkPoolAtmIv": [
        {
          "tenDayIv": 68.59,
          "thirtyDayIv": 80.08,
          "sixtyDayIv": 88.31,
          "nintyDayIv": 92,
          "oneHundredeightyDayIv": 95.77
        }
      ]
    },
    "result": 68.59
  },
  "result": 68.59,
  "statusCode": 200
}
```
