# GENERIC_API

![1.2.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/generic-api/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Variable env vars

To support a specific value for input parameter `apiName`, the environment variable `<API_NAME>_API_URL`, and optionally `<API_NAME>_AUTH_HEADER` and `<API_NAME>_AUTH_HEADER_VALUE` must be set, where `<API_NAME>` is the upper-snake-case version of the value provided for the `apiName` parameter.

## Custom Environment Variables

| Required? |             Name              |                      Description                      |  Type  |
| :-------: | :---------------------------: | :---------------------------------------------------: | :----: |
|    ✅     |      {API_NAME}\_API_URL      |       The API URL to use for a given `apiUrl`.        | string |
|           |    {API_NAME}\_AUTH_HEADER    | The header to pass the authentication credentials on. | string |
|           | {API_NAME}\_AUTH_HEADER_VALUE | The credentials to pass on the authentication header. | string |

## Rate Limiter

| Feeds    | Effective refresh interval                       |
| -------- | ------------------------------------------------ |
| 1 feed   | ~1 request every 3 seconds                       |
| 20 feeds | ~1 request per minute (all feeds share the pool) |

Adjust the limit based on how many feeds run on this EA and how often your data provider (DP) should be called.

### Overriding the default

You can override the built-in limit with these environment variables (they take precedence over the adapter’s default tier):

| Variable                     | Description                               |
| ---------------------------- | ----------------------------------------- |
| `RATE_LIMIT_CAPACITY_MINUTE` | Max requests per minute (overrides tier). |
| `RATE_LIMIT_CAPACITY_SECOND` | Max requests per second (overrides tier). |

**Example:** You run 20 feeds and want each feed to refresh about every 5 seconds. That’s 20 × 12 = **240 requests per minute**. Set:

```bash
RATE_LIMIT_CAPACITY_MINUTE=240
```

## Environment Variables

There are no environment variables for this adapter.

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                  Note                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------------------: |
| default |                             |             20              |                           | Rate Limiter is shared across all feeds |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                          Options                           | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [http](#http-endpoint), [multi-http](#multi-http-endpoint) | `http`  |

## Http Endpoint

`http` is the only supported name for this endpoint.

### Input Params

| Required? |         Name         | Aliases |                                       Description                                       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------------------: | :-----: | :-------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |       apiName        |         |               Used as prefix for environment variables to find API config               | string |         |         |            |                |
|    ✅     |       dataPath       |         |                   The path to the field containing the data to return                   | string |         |         |            |                |
|           |     ripcordPath      |         |                        The path to the ripcord field if expected                        | string |         |         |            |                |
|           | ripcordDisabledValue |         | If the ripcord field has a different value than this, the adapter will return an error. | string |         | `false` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "http",
    "apiName": "client-name",
    "dataPath": "PoR",
    "ripcordPath": "ripcord",
    "ripcordDisabledValue": "false"
  }
}
```

---

## Multi-http Endpoint

`multi-http` is the only supported name for this endpoint.

### Input Params

| Required? |           Name            | Aliases |                                                                                                            Description                                                                                                             |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |          apiName          |         |                                                                                    Used as prefix for environment variables to find API config                                                                                     |  string  |         |         |            |                |
|    ✅     |         dataPaths         |         |                                                                                        Array of data paths to extract from the API response                                                                                        | object[] |         |         |            |                |
|    ✅     |      dataPaths.name       |         |                                                                                              Name of the field in the output response                                                                                              |  string  |         |         |            |                |
|    ✅     |      dataPaths.path       |         |                                                                                               JSON path to extract from API response                                                                                               |  string  |         |         |            |                |
|           |        ripcordPath        |         |                                                                                             The path to the ripcord field if expected                                                                                              |  string  |         |         |            |                |
|           |   ripcordDisabledValue    |         |                                                                      If the ripcord field has a different value than this, the adapter will return an error.                                                                       |  string  |         | `false` |            |                |
|           | providerIndicatedTimePath |         | JSON path to extract the timestamp from the API response. Supports ISO 8601 datetime strings (e.g., "2026-01-19T06:56:22.194Z") or Unix milliseconds (number). The value will be placed in timestamps.providerIndicatedTimeUnixMs. |  string  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "multi-http",
    "apiName": "NX8",
    "dataPaths": [
      {
        "name": "result",
        "path": "net_asset_value"
      },
      {
        "name": "nav",
        "path": "net_asset_value"
      },
      {
        "name": "aum",
        "path": "asset_under_management"
      }
    ],
    "ripcordPath": "ripcord",
    "ripcordDisabledValue": "false",
    "providerIndicatedTimePath": "updatedAt"
  }
}
```

---

MIT License
