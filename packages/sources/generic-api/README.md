# GENERIC_API

![1.3.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/generic-api/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |              Name              |                                        Description                                        |  Type  | Options | Default |
| :-------: | :----------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |      ${API_NAME}\_API_URL      |                        The API URL to use for a given ${API_NAME}                         | string |         |         |
|           |    ${API_NAME}\_AUTH_HEADER    |           The header to pass the authentication credentials on for ${API_NAME}            | string |         |         |
|           | ${API_NAME}\_AUTH_HEADER_VALUE |           The credentials to pass on the authentication header for ${API_NAME}            | string |         |         |
|           |     BACKGROUND_EXECUTE_MS      | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                          Options                           | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [http](#http-endpoint), [multi-http](#multi-http-endpoint) | `http`  |

## Http Endpoint

`http` is the only supported name for this endpoint.

### Input Params

| Required? |           Name            | Aliases |                                                                                                            Description                                                                                                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |          apiName          |         |                                                                                    Used as prefix for environment variables to find API config                                                                                     | string |         |         |            |                |
|           |        ripcordPath        |         |                                                                                             The path to the ripcord field if expected                                                                                              | string |         |         |            |                |
|           |   ripcordDisabledValue    |         |                                                                      If the ripcord field has a different value than this, the adapter will return an error.                                                                       | string |         | `false` |            |                |
|           | providerIndicatedTimePath |         | JSON path to extract the timestamp from the API response. Supports ISO 8601 datetime strings (e.g., "2026-01-19T06:56:22.194Z") or Unix milliseconds (number). The value will be placed in timestamps.providerIndicatedTimeUnixMs. | string |         |         |            |                |
|    ✅     |         dataPath          |         |                                                                                        The path to the field containing the data to return                                                                                         | string |         |         |            |                |

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
|           |        ripcordPath        |         |                                                                                             The path to the ripcord field if expected                                                                                              |  string  |         |         |            |                |
|           |   ripcordDisabledValue    |         |                                                                      If the ripcord field has a different value than this, the adapter will return an error.                                                                       |  string  |         | `false` |            |                |
|           | providerIndicatedTimePath |         | JSON path to extract the timestamp from the API response. Supports ISO 8601 datetime strings (e.g., "2026-01-19T06:56:22.194Z") or Unix milliseconds (number). The value will be placed in timestamps.providerIndicatedTimeUnixMs. |  string  |         |         |            |                |
|    ✅     |         dataPaths         |         |                                                                                        Array of data paths to extract from the API response                                                                                        | object[] |         |         |            |                |
|    ✅     |      dataPaths.name       |         |                                                                                              Name of the field in the output response                                                                                              |  string  |         |         |            |                |
|    ✅     |      dataPaths.path       |         |                                                                                               JSON path to extract from API response                                                                                               |  string  |         |         |            |                |

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
