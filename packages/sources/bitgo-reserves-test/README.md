# BITGO_RESERVES-TEST

![1.0.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bitgo-reserves-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name         |                                                                              Description                                                                               |  Type  | Options |                    Default                    |
| :-------: | :------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------------------: |
|           | STAGING_API_ENDPOINT |                                                                 Staging API endpoint for Data Provider                                                                 | string |         | `https://reserves.gousd-staging.com/por.json` |
|    ✅     |    STAGING_PUBKEY    | Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\n...contents...\n-----END PUBLIC KEY-----" | string |         |                                               |
|           |  TEST_API_ENDPOINT   |                                                                  Test API endpoint for Data Provider                                                                   | string |         |  `https://reserves.gousd-test.com/por.json`   |
|    ✅     |     TEST_PUBKEY      | Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\n...contents...\n-----END PUBLIC KEY-----" | string |         |                                               |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                             Options                                                              |      Default       |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [reserves-staging](#reserves-staging-endpoint), [reserves-test](#reserves-test-endpoint), [reserves](#reserves-staging-endpoint) | `reserves-staging` |

## Reserves-staging Endpoint

Supported names for this endpoint are: `reserves`, `reserves-staging`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves-staging"
  }
}
```

---

## Reserves-test Endpoint

`reserves-test` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves-test"
  }
}
```

---

MIT License
