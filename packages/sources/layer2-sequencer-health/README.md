# Chainlink External Adapter for Example

Adapter that checks the Layer 2 Sequencer status


### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | `DELTA` | Maximum time in miliseconds from last seen block for the sequencer to be considered healthy |         |     180000 (3 min)        |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|     ✅     | network | Layer 2 Network to check | arbitrum or optimism |     |

---
### Sample Input

```json
{
  "id": "1",
  "data": {
    "network": "arbitrum"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "healthy": true
  },
  "statusCode": 200
}
```
