# Chainlink External Adapter for the Bureau of Economic Analysis (BEA)

![1.1.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bea/package.json)

Base URL https://apps.bea.gov/api

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                            Description                             |  Type  | Options |          Default           |
| :-------: | :----------: | :----------------------------------------------------------------: | :----: | :-----: | :------------------------: |
|           | API_ENDPOINT |                                                                    | string |         | `https://apps.bea.gov/api` |
|    ✅     |   API_KEY    | An API key that can be obtained from the data provider's dashboard | string |         |                            |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [average](#average-endpoint) | `average` |

## Average Endpoint

`average` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |                     Description                     |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :-------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|           | series |         | The series code to query (`DGDSRG`, `DPCERG`, etc.) | string |         | `DPCERG` |            |                |
|           |  last  |         |             The last N months to query              | number |         |   `3`    |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "average",
    "series": "DPCERG",
    "last": 3
  },
  "debug": {
    "cacheKey": "qw1uwRyMT0AuhV5lK4siprcSv8E="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "BEAAPI": {
      "Results": {
        "Data": [
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M10",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.775",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M07",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "115.849",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DGDSRG",
            "LineNumber": "2",
            "LineDescription": "Goods",
            "TimePeriod": "2020M01",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "94.989",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M08",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "116.314",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M01",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.002",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M03",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "110.802",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M02",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.071",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M04",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "110.213",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M06",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "110.918",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M07",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.221",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M05",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "110.385",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M08",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.563",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M09",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.736",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M12",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "112.220",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M01",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "112.570",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M02",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "112.878",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M03",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "113.518",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M05",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "114.767",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M04",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "114.161",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2021M06",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "115.388",
            "NoteRef": "T20804"
          },
          {
            "TableName": "T20804",
            "SeriesCode": "DPCERG",
            "LineNumber": "1",
            "LineDescription": "Personal consumption expenditures (PCE)",
            "TimePeriod": "2020M11",
            "METRIC_NAME": "Fisher Price Index",
            "CL_UNIT": "Level",
            "UNIT_MULT": "0",
            "DataValue": "111.790",
            "NoteRef": "T20804"
          }
        ],
        "Notes": []
      }
    },
    "result": 115.85033333333334
  },
  "result": 115.85033333333334,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
