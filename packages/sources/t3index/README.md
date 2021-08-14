# Chainlink External Adapter for T3 Index

### Input Parameters

| Required? |   Name   |     Description     |                                                              Options                                                               |   Defaults to    |
| :-------: | :------: | :-----------------: | :--------------------------------------------------------------------------------------------------------------------------------: | :--------------: |
|           | endpoint | The endpoint to use | [30-day-iv-price](#30-Day-IV-Price-Endpoint), [historical-eod-price](#Historical-EOD-Price), [historical-price](#Historical-Price) | historical-price |

---

## 30 Day IV Price

Returns the current index price, measured by the Expected 30-day Implied Volatility derived from tradeable Bitcoin or Ethereum option prices

### Input Params

| Required? |   Name   |           Description            |   Options    | Defaults to |
| :-------: | :------: | :------------------------------: | :----------: | :---------: |
|    ✅     | `symbol` | The symbol of the asset to query | `BTC`, `ETH` |             |

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
    "datetime": "2021-08-03 15:30:15",
    "price": 111.7,
    "name": "BitVol_ETH",
    "result": 111.7
  },
  "statusCode": 200
}
```

## Historical EOD Price

Returns the eod index price for the selected date

### Input Params

| Required? |   Name   |           Description            |        Options         | Defaults to |
| :-------: | :------: | :------------------------------: | :--------------------: | :---------: |
|    ✅     | `symbol` | The symbol of the asset to query | `BTC`, `ETH`, `SPIKES` |             |
|    ✅     |  `date`  |  The date to query (YYYY-MM-DD)  |                        |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "ETH",
    "date": "2020-04-15"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "data": [
      ["2020-04-15", 105.48],
      ["2020-04-16", 103.27],
      ["2020-04-17", 102.55],
      ["2020-04-18", 99.87],
      ["2020-04-19", 101.69],
      ["2020-04-20", 99.97]
    ],
    "name": "BitVol_ETH",
    "result": 105.48
  },
  "statusCode": 200
}
```

## Historical Price

Returns the index price for the selected date and time (data available in 15 second increments)

### Input Params

| Required? |   Name   |                    Description                     |   Options    | Defaults to |
| :-------: | :------: | :------------------------------------------------: | :----------: | :---------: |
|    ✅     | `symbol` |          The symbol of the asset to query          | `BTC`, `ETH` |             |
|    ✅     |  `date`  |           The date to query (YYYY-MM-DD)           |              |             |
|    ✅     |  `time`  | The time to query (HH:MM:SS, 15 second increments) |              |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "BTC",
    "date": "2021-07-01",
    "time": "00:01:00"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "data": [
      ["00:00:00", 101.1],
      ["00:00:15", 101.1],
      ["00:00:30", 101.07],
      ["00:00:45", 101.1],
      ["00:01:00", 100.99]
    ],
    "name": "BitVol",
    "result": 100.99
  },
  "statusCode": 200
}
```
