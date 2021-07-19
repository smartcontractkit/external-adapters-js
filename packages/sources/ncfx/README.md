# Chainlink External Adapter for NCFX

A template to be used as an example for new [External Adapters](https://github.com/smartcontractkit/external-adapters-js)

(please fill out with corresponding information)

An example adapter description

### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|     ✅      | API_USERNAME | The username to the NCFX account |         |             |
|      ✅     | API_PASSWORD | The password to the NCFX account |         |             |

---

### Input Parameters

No adapter specific input parameters

---

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 1822.9957,
    "statusCode": 200,
    "data": {
        "result": 1822.9957
    }
}
```
