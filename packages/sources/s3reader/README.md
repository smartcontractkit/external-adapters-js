# S3READER

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/s3reader/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |     Default     |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------: |
|           |    AWS_CONFIG_FILE    |                               Path to local AWS config file                               | string |         | `~/.aws/config` |
|           |      AWS_PROFILE      |                              Profile name with access to S3                               | string |         |     `prod`      |
|           |  AWS_SDK_LOAD_CONFIG  |                                            ???                                            | number |         |       `1`       |
|           |  AWS_DEFAULT_REGION   |                      Default Region of AWS profile with access to S3                      | string |         |   `us-west-2`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |     `10000`     |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                  Options                   | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [csv](#csv-endpoint), [nav](#csv-endpoint) |  `csv`  |

## Csv Endpoint

Supported names for this endpoint are: `csv`, `nav`.

### Input Params

| Required? |  Name  | Aliases |                   Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | bucket |         |             The S3 bucket to query              | string |         |         |            |                |
|    ✅     |  key   | `path`  |        The path of the file stored in S3        | string |         |         |            |                |
|    ✅     |  row   |         |        The row of the CSV file to query         | string |         |         |            |                |
|    ✅     | column |         | The column of the row in the CSV file to return | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "csv",
    "bucket": "s3_bucket",
    "key": "path/to/file.csv",
    "row": "100",
    "column": "AA"
  }
}
```

---

MIT License
