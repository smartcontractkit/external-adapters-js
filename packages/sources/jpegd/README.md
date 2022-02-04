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
|    ✅     | `block` | The block data is being queried from |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "block": 9999999
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "success": true,
    "block": 9999999,
    "value": 100
  },
  "statusCode": 200
}
```
