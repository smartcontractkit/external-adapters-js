# Chainlink External Adapter for XBTO

### Input Params

| Required? |   Name   | Description |    Options     | Defaults to |
| :-------: | :------: | :---------: | :------------: | :---------: |
|           | `market` |             | `brent`, `wti` |   `brent`   |

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
    "index": 40.12795,
    "duration": 35.71406,
    "1st_sym": "BRNF1",
    "1st_dte": 27.13591,
    "1st_mid": 40.005,
    "1st_wt": 0.7140615,
    "2nd_sym": "BRNG1",
    "2nd_dte": 57.13591,
    "2nd_mid": 40.435,
    "2nd_wt": 0.2859385,
    "3rd_sym": "BRNH1",
    "3rd_dte": 87.13591,
    "3rd_mid": 40.865,
    "3rd_wt": 0,
    "result": 40.12795
  },
  "result": 40.12795,
  "statusCode": 200
}
```
