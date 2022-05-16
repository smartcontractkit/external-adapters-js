# Chainlink External Adapter for US Consumer Price Index (USCPI)

![1.2.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/uscpi-one/package.json)

Base URL https://api.bls.gov/publicAPI/v2

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |              Description               |  Type  | Options | Default |
| :-------: | :----------: | :------------------------------------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT |                                        |        |         |         |
|           |   API_KEY    | An optional API key to increase limits | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [series](#series-endpoint) | `series` |

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
  },
  "debug": {
    "cacheKey": "lU5fDIMOQ5L/KT5w0t5K2h4Ql5I="
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

<details>
<summary>Additional Examples</summary>

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
  },
  "debug": {
    "cacheKey": "lU5fDIMOQ5L/KT5w0t5K2h4Ql5I="
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
              "value": "271.123",
              "footnotes": [{}]
            }
          ]
        }
      ]
    },
    "result": 271.123
  },
  "result": 271.123,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
