# Chainlink COVID Tracker External Adapter

## US Data API (default)

### Endpoint

https://api.covidtracking.com/v1/us/current.json

### Input Params

- `field`: The data field to return. Must be in camel case style. (required, see Current US Values on https://covidtracking.com/data/api for a full list)
- `date`: The date to query formatted by `[YEAR][month][DAY]` e.g. `20201012`, if not given defaults to the most recent date with available data (optional)
- `endpoint`: The endpoint to use (defaults to "us", one of "us")

### Example Usage

```json
{ "field": "death" }
```

#### Output

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
