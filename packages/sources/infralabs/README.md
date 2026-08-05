# INFRALABS

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/infralabs/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name            |                                  Description                                  |  Type   | Options |                          Default                           |
| :-------: | :-----------------------: | :---------------------------------------------------------------------------: | :-----: | :-----: | :--------------------------------------------------------: |
|    ✅     |          API_KEY          |                Infralabs API key (shared across all endpoints)                | string  |         |                                                            |
|           |     USHP_API_ENDPOINT     |                         Infralabs USHP index API URL                          | string  |         | `https://ushp-index-interface.staging.infralabs.xyz/index` |
|           |  USHP_MAX_STALENESS_SECS  | Maximum age in seconds for the USHP index value before it is considered stale | number  |         |                         `3600000`                          |
|           |   BACKGROUND_EXECUTE_MS   |                Milliseconds between background data refreshes                 | number  |         |                          `10000`                           |
|           |      KMS_KEY_TTL_MS       |       Milliseconds before a cached KMS public key is considered expired       | number  |         |                          `60000`                           |
|           |        KMS_REGION         |               AWS region where the Infralabs KMS key is hosted                | string  |         |                        `us-east-1`                         |
|    ✅     |     AWS_ACCESS_KEY_ID     |                   AWS access key ID for KMS authentication                    | string  |         |                                                            |
|    ✅     |   AWS_SECRET_ACCESS_KEY   |                 AWS secret access key for KMS authentication                  | string  |         |                                                            |
|           | KMS_VERIFICATION_DISABLED |                      Disable KMS signature verification                       | boolean |         |                           `true`                           |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [ushp](#ushp-endpoint) | `ushp`  |

## Ushp Endpoint

`ushp` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "ushp"
  }
}
```

---

MIT License
