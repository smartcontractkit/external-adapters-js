# Chainlink External Adapter for [GoldAPI.io](https://www.goldapi.io)

GoldAPI.io is a Gold & Silver Prices JSON API. It provides 100% real-time precious metals prices from FOREX, SAXO, OANDA and IDC Exchanges and supports all major currencies like `USD`, `AUD`, `CAD`, `BTC`, `EUR`, `CHF`, `GBP`, `INR`, `CNY`, `SGD` and others. Use this adapter for connecting to [GoldAPI.io](https://www.goldapi.io) from a Chainlink node.

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |  An API key that can be obtained from [GoldAPI.io dashboard](https://www.goldapi.io)          |         |             |

---

### Input Params

| Required? |            Name            |               Description                | Options | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  | The symbol of the metal:. Supported: `XAU`, `XAG`, `XPT`, `XPD`       |         |             |
|    ✅     | `quote`, `to`, or `market` | The currency code. The list of supported currencie codes can be obtained from [GoldAPI.io dashboard](https://www.goldapi.io). To get Gold/Silver Ratio set `XAU` as a metal symbol and `XAG` as Currency Code.       |         |             |

## Output

> curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "from": "XAG", "quote": "CAD" } }'

```json
{
  "jobRunID": "1",
  "result": 34.40924,
  "statusCode": 200,
  "data": {
    "timestamp": 1614303778,
    "metal": "XAG",
    "currency": "CAD",
    "exchange": "OANDA",
    "symbol": "OANDA:XAGCAD",
    "prev_close_price": 34.57952,
    "open_price": 34.57952,
    "low_price": 34.2677,
    "high_price": 34.837265,
    "open_time": 1614290400,
    "price": 34.40924,
    "ch": -0.17028,
    "chp": -0.49,
    "ask": 34.43314,
    "bid": 34.39152,
    "result": 34.40924
  }
}
```

> curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "from": "XAU", "quote": "RUB" } }'

```json
{
  "jobRunID": "1",
  "result": 131965.493,
  "statusCode": 200,
  "data": {
    "timestamp": 1614304269,
    "metal": "XAU",
    "currency": "RUB",
    "exchange": "GOLDAPI",
    "symbol": "GOLDAPI:XAURUB",
    "open_time": 1614290400,
    "price": 131965.493,
    "ch": -60.4074,
    "ask": 131989.3577,
    "bid": 131931.9334,
    "result": 131965.493
  }
}
```

> curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "from": "XAU", "quote": "XAG" } }'

```json
{
  "jobRunID": "1",
  "result": 64.89,
  "statusCode": 200,
  "data": {
    "timestamp": 1614303979,
    "metal": "XAU",
    "currency": "XAG",
    "exchange": "SAXO",
    "symbol": "SAXO:XAUXAG",
    "prev_close_price": 64.545,
    "open_price": 64.54,
    "low_price": 64.21,
    "high_price": 65.09,
    "open_time": 1614297600,
    "price": 64.89,
    "chp": 0.53,
    "ask": 64.96,
    "bid": 64.83,
    "ch": 0.34,
    "result": 64.89
  }
}
```
