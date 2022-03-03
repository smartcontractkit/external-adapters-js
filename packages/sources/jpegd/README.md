# Chainlink External Adapter for JPEG'd

Query NFT collection values from the JPEG'd API.

### Environment Variables

| Required? |  Name   |              Description               | Options | Defaults to |
| :-------: | :-----: | :------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key provided by the JPEG'd team |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [punks](#Punks-Endpoint) |    punks    |

---

## Punks Endpoint

Queries JPEG'd API for the value of a floor Cryptopunk at the requested block.

### Input Params

| Required? |  Name   |             Description              | Options | Defaults to |
| :-------: | :-----: | :----------------------------------: | :-----: | :---------: |
|           | `block` | The block data is being queried from |         |   latest    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "block": "latest"
  }
}
```

### Sample Output

```json
{
  "data": {
    "result": 71.71525868055556
  },
  "jobRunID": "1",
  "providerStatusCode": 200,
  "result": 71.71525868055556,
  "statusCode": 200
}
```
