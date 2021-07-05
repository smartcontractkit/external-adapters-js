# Chainlink External Adapter for QDT

External adapter for integrating with Quantum Data Technologie's APIs.

> Models are run/updated every day at UTC 06:30

### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|     ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|     ✅     | endpoint | The endpoint to use | [price](#QDT-Price-Endpoint) |   example   |

---

## QDT Price Endpoint

Return's price prediction data for a given symbol

### Input Params

| Required? |   Name   |                      Description                       |            Options             | Defaults to |
| :-------: | :------: | :----------------------------------------------------: | :----------------------------: | :---------: |
|           | `symbol` |          The symbol of the currency to query           |             `BTC`              |    `BTC`    |
|           |  `days`  | Number of days from today to get the closing day price | number in range of `0` to `12` |     `0`     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "days": 1
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 33855.684
  },
  "result": 33855.684,
  "statusCode": 200
}
```
