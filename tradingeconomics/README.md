# Chainlink External Adapter for Trading Economics

### Environment Variables

| Required? |       Name        |                       Description                       | Options | Defaults to |
| :-------: | :---------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     |  API_CLIENT_KEY   |                                                         |         |             |
|    ✅     | API_CLIENT_SECRET |                                                         |         |             |
|           |    WS_TIMEOUT     | The timeout for waiting for a response in the WS stream |         |   `5000`    |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [markets](#Markets-Endpoint) |   markets   |

---

## Markets Endpoint

Returns the price of a currency.

First attempts to request over a Websocket connecting and then falls back to HTTP

### Input Params

| Required? |          Name           |             Description             | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `asset` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": { "base": "FTSE" }
}
```

### Sample Output

WS

```json
{
  "jobRunID": "1",
  "data": {
    "s": "UKX:IND",
    "i": "UKX",
    "pch": -0.28,
    "nch": -17.37,
    "bid": 6106.32,
    "ask": 6106.32,
    "price": 6106.32,
    "dt": 1593080344361,
    "state": "open",
    "type": "index",
    "dhigh": 6320.12,
    "dlow": 6068.87,
    "o": 6320.12,
    "prev": 6123.69,
    "topic": "UKX",
    "result": 6106.32
  },
  "result": 6106.32,
  "statusCode": 200
}
```

HTTP

```json
[
  {
    "Symbol": "AAPL:US",
    "Ticker": "AAPL",
    "Name": "Apple",
    "Country": "United States",
    "Date": "2021-03-03T21:00:00",
    "Type": "stocks",
    "decimals": 2.0,
    "state": "CLOSED    ",
    "Last": 122.825,
    "Close": 122.825,
    "CloseDate": "2021-03-03T00:00:00",
    "MarketCap": 1303031131050.0,
    "URL": "/aapl:us",
    "Importance": 500,
    "DailyChange": -2.295,
    "DailyPercentualChange": -1.8342,
    "WeeklyChange": -2.525,
    "WeeklyPercentualChange": -2.0144,
    "MonthlyChange": -14.565,
    "MonthlyPercentualChange": -10.6012,
    "YearlyChange": 47.14,
    "YearlyPercentualChange": 62.2845,
    "YTDChange": -9.865,
    "YTDPercentualChange": -7.4346,
    "day_high": 125.71,
    "day_low": 121.84,
    "yesterday": 125.12,
    "lastWeek": 125.35,
    "lastMonth": 137.39,
    "lastYear": 75.685,
    "startYear": 132.69,
    "ISIN": "US0378331005                  ",
    "frequency": "Daily, Intraday, Live Stream",
    "LastUpdate": "2021-03-03T21:01:00"
  }
]
```
