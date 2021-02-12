# Chainlink External Adapter for Fmp Cloud

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

### Input Params

| Required? |            Name            |             Description             | Options | Defaults to |
| :-------: | :------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `asset`, `from`, or `base` | The symbol of the currency to query |         |             |

### Output Format

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 245.52,
      "changesPercentage": -0.55,
      "change": -1.36,
      "dayLow": 244.3,
      "dayHigh": 258,
      "yearHigh": 327.85,
      "yearLow": 170.27,
      "marketCap": 1074267815936,
      "priceAvg50": 287.00342,
      "priceAvg200": 269.64044,
      "volume": 68684527,
      "avgVolume": 47970853,
      "exchange": "NASDAQ",
      "open": 250.75,
      "previousClose": 246.88,
      "eps": 12.595,
      "pe": 19.49345,
      "earningsAnnouncement": "2020-01-28T21:30:00.000+0000",
      "sharesOutstanding": 4375479808,
      "timestamp": 1585227237
    }
  ],
  "statusCode": 200
}
```
