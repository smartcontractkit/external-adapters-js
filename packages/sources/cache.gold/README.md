# Chainlink External Adapter for Cache.gold

### Input Parameters

| Required? |   Name   |     Description     |                                                                         Options                                                                         | Defaults to |
| :-------: | :------: | :-----------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [lockedGold](#lockedGold)|    lockedGold    |

---

## LokedGold Endpoint

Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold)

### Input Params

|         Required?          |            Name            |                                                                  Description                                                                   |                                        Options                                         | Defaults to |
| :------------------------: | :------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :---------: |
|  ⛔ None  |          None          | no parameters are needed to make the request |  |             |

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
  "result":62293.77,
  "statusCode":200,
  "data":{
    "result":62293.77
  }
}

```