# Chainlink External Adapter for Gramchain

An external adapter to return the grams of gold (PureGrams) under custody

---

### Input Parameters

| Required? |   Name   |     Description     |                   Options                    | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [getgrambalances](#GetGramBalances-Endpoint) |   example   |

---

## GetGramBalances Endpoint

---

### Input Params

| Required? |         Name          |           Description           | Options | Defaults to |
| :-------: | :-------------------: | :-----------------------------: | :-----: | :---------: |
|           |     `custodianID`     | The identifier of the custodian |         |   `Cache`   |
|           |      `metalCode`      |     The symbol of the metal     |         |    `AU`     |
|           | `utilizationLockCode` |  The status of the utilization  |         |  `Locked`   |

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 93121.78,
  "providerStatusCode": 200,
  "statusCode": 200,
  "data": {
    "result": 93121.78
  }
}
```
