# TENBIN

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tenbin/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |                                              Default                                              |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------------------------------------------------------------------------: |
|    ✅     |        API_KEY        |                               An API key for Data Provider                                | string |         |                                                                                                   |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         |                        `https://public-api.tenbin.xyz/v1/verifier/attest`                         |
|           |  BUILD_JSON_ENDPOINT  |          URL of the build.json file containing the image digest for verification          | string |         | `https://github.com/tenbinlabs/verification-service-releases/releases/latest/download/build.json` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |                                              `10000`                                              |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                    Options                     |      Default       |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [verified-balance](#verified-balance-endpoint) | `verified-balance` |

## Verified-balance Endpoint

`verified-balance` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "verified-balance"
  }
}
```

---

MIT License
