# GENERIC_API

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/generic-api/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Variable env vars

To support a specific value for input parameter `apiName`, the environment variables `<API_NAME>_API_URL`, `<API_NAME>_AUTH_HEADER` and `<API_NAME>_AUTH_HEADER_VALUE` must be set, where `<API_NAME>` is the upper-snake-case version of the value provided for the `apiName` parameter.

## Environment Variables

There are no environment variables for this adapter.

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             20              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [http](#http-endpoint) | `http`  |

## Http Endpoint

`http` is the only supported name for this endpoint.

### Input Params

| Required? |         Name         | Aliases |                                      Description                                       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------------------: | :-----: | :------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |       apiName        |         |              Used as prefix for environment variables to find API config               | string |         |         |            |                |
|    ✅     |       dataPath       |         |                  The path to the field containing the data to return                   | string |         |         |            |                |
|           |     ripcordPath      |         |                       The path to the ripcord field if expected                        | string |         |         |            |                |
|           | ripcordDisabledValue |         | The value the ripcord field should have during normal operation, converted to a string | string |         | `false` |            |                |

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

MIT License
