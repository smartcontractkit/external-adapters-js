# Chainlink External Adapter for US Consumer Price Index (USCPI)

Version: 1.1.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           | API_ENDPOINT |             |      |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [series](#series-endpoint) | `series` |

---

## Series Endpoint

`series` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                                                   Description                                                   |  Type  | Options |    Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :-------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----------: | :--------: | :------------: |
|           | serie |         |                           The US CPI Data serieID (`CUSR0000SA0`, `LNS14000000`, etc)                           | string |         | `CUSR0000SA0` |            |                |
|           | year  |         | The year serie filter (`2021`, `2020`, etc). It is mandatory to specify the `month` and `year` values together. | string |         |               |            |                |
|           | month |         |  The month serie filter `may`, `july`, etc. It is mandatory to specify the `month` and `year` values together.  | string |         |               |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "series",
    "resultPath": "value",
    "serie": "CUSR0000SA0",
    "year": "2021",
    "month": "July"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "REQUEST_SUCCEEDED",
    "responseTime": 212,
    "message": [],
    "Results": {
      "series": [
        {
          "seriesID": "CUSR0000SA0",
          "data": [
            {
              "year": "2021",
              "period": "M09",
              "periodName": "September",
              "latest": "true",
              "value": "274.138",
              "footnotes": [{}]
            },
            {
              "year": "2021",
              "period": "M08",
              "periodName": "August",
              "value": "273.012",
              "footnotes": [{}]
            },
            {
              "year": "2021",
              "period": "M07",
              "periodName": "July",
              "value": "272.265",
              "footnotes": [{}]
            }
          ]
        }
      ]
    },
    "result": 272.265
  },
  "result": 272.265,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
