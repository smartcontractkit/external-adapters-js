# Chainlink GeoDB External Adapter

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [matches](#Matches-Endpoint) |  `matches`  |

---

## Matches Endpoint

Counts the number of matches within the circle specified by a radius and coordinates during the selected time period

### Input Params

| Required? |   Name   |           Description            | Options | Defaults to |
| :-------: | :------: | :------------------------------: | :-----: | :---------: |
|    ✅     |  `lat`   |       latitude coordinate        |         |             |
|    ✅     |  `lng`   |       longitude coordinate       |         |             |
|    ✅     | `radius` | radius around coordinates (in m) |         |             |
|    ✅     | `start`  | start time (yyyy-mm-dd hh:mm:ss) |         |             |
|    ✅     |  `end`   |  end time (yyyy-mm-dd hh:mm:ss)  |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "lat": "45.7905",
    "lng": "11.9202",
    "radius": "500000",
    "start": "2021-01-01 20:00:00",
    "end": "2021-02-21 20:30:00"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1496
  },
  "result": 1496,
  "statusCode": 200
}
```
