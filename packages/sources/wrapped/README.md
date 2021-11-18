# Chainlink External Adapter for Wrapped

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [deposits](#Deposits-Endpoint) |  deposits   |

---

## Deposits Endpoint

### Input Params

| Required? |   Name   |             Description             |       Options       | Defaults to |
| :-------: | :------: | :---------------------------------: | :-----------------: | :---------: |
|    ✅     | `symbol` | The symbol of the currency to query | `BTC`, `ETH`, `LTC` |             |

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
  "jobRunID": "1",
  "result": {
    "coin": "ETH",
    "addresses": [
      {
        "address": "0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4"
      },
      {
        "address": "0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2"
      },
      {
        "address": "0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677"
      }
    ]
  },
  "statusCode": 200,
  "data": {
    "result": {
      "coin": "ETH",
      "addresses": [
        {
          "address": "0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4"
        },
        {
          "address": "0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2"
        },
        {
          "address": "0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677"
        }
      ]
    }
  }
}
```
