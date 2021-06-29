# Chainlink COVID Tracker External Adapter

Notice: The COVID Tracking Project is ending all data collection on March 7, 2021. The existing API will continue to work until May 2021, but will only include data up to March 7, 2021.

### Input Parameters

| Required? |   Name   |     Description     |      Options       | Defaults to |
| :-------: | :------: | :-----------------: | :----------------: | :---------: |
|           | endpoint | The endpoint to use | [us](#US-Endpoint) |     us      |

---

## US Endpoint

### Input Params

| Required? |  Name   |                               Description                               | Options |             Defaults to              |
| :-------: | :-----: | :---------------------------------------------------------------------: | :-----: | :----------------------------------: |
|           | `field` | The object path to access the value that will be returned as the result |         |               `death`                |
|           | `date`  |  The date to query formatted by `[YEAR][MONTH][DAY]` (e.g. `20201012`)  |         | Most recent date with available data |

### Sample Input

```json
{
  "id": "1",
  "data": { "field": "death", "location": "usa" }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "date": 20201022,
    "states": 56,
    "positive": 8366221,
    "negative": 111569861,
    "pending": 12222,
    "hospitalizedCurrently": 41010,
    "hospitalizedCumulative": 443777,
    "inIcuCurrently": 8086,
    "inIcuCumulative": 23018,
    "onVentilatorCurrently": 2147,
    "onVentilatorCumulative": 2641,
    "recovered": 3353056,
    "dateChecked": "2020-10-22T00:00:00Z",
    "death": 214845,
    "hospitalized": 443777,
    "totalTestResults": 128964596,
    "lastModified": "2020-10-22T00:00:00Z",
    "total": 0,
    "posNeg": 0,
    "deathIncrease": 1173,
    "hospitalizedIncrease": 2706,
    "negativeIncrease": 923136,
    "positiveIncrease": 76560,
    "totalTestResultsIncrease": 1139419,
    "hash": "a487345726650f5e4fc102ef1e42b6378fee3493",
    "result": 1139419
  },
  "result": 1139419,
  "statusCode": 200
}
```
