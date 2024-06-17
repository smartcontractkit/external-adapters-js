# S3_CSV_READER

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/s3-csv-reader/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [csv](#csv-endpoint) |  `csv`  |

## Csv Endpoint

`csv` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases |                                                    Description                                                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :---------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    bucket     |         |                                              The S3 bucket to query                                               | string |         |         |            |                |
|    ✅     |      key      | `path`  |                                         The path of the file stored in S3                                         | string |         |         |            |                |
|    ✅     |   headerRow   |         |                        The 1-indexed row of the CSV file that contains the column headers                         | number |         |         |            |                |
|    ✅     | matcherColumn |         |                                 The column field to compare with the matcherValue                                 | string |         |         |            |                |
|    ✅     | matcherValue  |         |                                       The value to match with matcherField                                        | string |         |         |            |                |
|    ✅     | resultColumn  |         | The column of the CSV file to return a result for, where the row value for matcherColumn is equal to matcherValue | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "csv",
    "bucket": "s3_bucket",
    "key": "path/to/file.csv",
    "headerRow": 2,
    "matcherColumn": "matcherColumn",
    "matcherValue": "value",
    "resultColumn": "resultColumn"
  }
}
```

---

MIT License
