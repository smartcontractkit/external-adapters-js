# Chainlink External Adapter for blockstream

### Input Parameters

| Required? |   Name   |     Description     |                          Options                           | Defaults to  |
| :-------: | :------: | :-----------------: | :--------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | [difficulty](#Blocks-Endpoint), [height](#Blocks-Endpoint) | `difficulty` |

---

## Blocks Endpoint

### Input Parameters

| Required? | Name  |             Description             | Options | Defaults to |
| :-------: | :---: | :---------------------------------: | :-----: | :---------: |
|           | field | The object path to the result value |         | difficulty  |

When using `difficulty` or `height` the field will be filled as the endpoint.

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
  "data": {
    "0": {
      "id": "00000000000000000004f750822529412b53652759dfbc4adbe1fa247cf03fe0",
      "height": 678212,
      "version": 1073676288,
      "timestamp": 1617825114,
      "tx_count": 2569,
      "size": 1333284,
      "weight": 3993177,
      "merkle_root": "bb11ec6d7be9cdfd9cef4b6e9b2e6c0b6999b3d36e9603d9d37c0995390fd0f5",
      "previousblockhash": "0000000000000000000548216a24e05e8e4d9ba2a1d835f19bfd677d0205501d",
      "mediantime": 1617822205,
      "nonce": 4102352243,
      "bits": 386673224,
      "difficulty": 23137439666472
    },
    ...
    "result": 23137439666472
  },
  "result": 23137439666472,
  "statusCode": 200
}
```
