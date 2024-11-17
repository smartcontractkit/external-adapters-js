# S3_CSV_READER

![2.2.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/s3-csv-reader/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |
|           |     LOOKBACK_DAYS     |      The number of days to look back when querying for the most recent file by date       | number |         |  `10`   |

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

| Required? |     Name      |   Aliases    |                                                               Description                                                                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------: | :----------: | :--------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    bucket     |              |                                                          The S3 bucket to query                                                          | string |         |         |            |                |
|    ✅     |   keyPrefix   | `pathPrefix` | The path prefix of the file stored in S3. Will be prefixed onto <DATE>.csv to search for older files, e.g. 'path/prefix-01-02-2024.csv'. | string |         |         |            |                |
|    ✅     |   headerRow   |              |                                    The 1-indexed row of the CSV file that contains the column headers                                    | number |         |         |            |                |
|    ✅     | matcherColumn |              |                                            The column field to compare with the matcherValue                                             | string |         |         |            |                |
|    ✅     | matcherValue  |              |                                                   The value to match with matcherField                                                   | string |         |         |            |                |
|    ✅     | resultColumn  |              |            The column of the CSV file to return a result for, where the row value for matcherColumn is equal to matcherValue             | string |         |         |            |                |
|           |   delimiter   |              |                                                   The delimiter used for the CSV file                                                    | string |         |   `,`   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "csv",
    "bucket": "s3-bucket",
    "keyPrefix": "path/to/file",
    "headerRow": 2,
    "matcherColumn": "matcherColumn",
    "matcherValue": "value",
    "resultColumn": "resultColumn",
    "delimiter": ","
  }
}
```

---

MIT License
