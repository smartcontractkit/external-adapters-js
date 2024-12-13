# BITGO_RESERVES

![1.1.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bitgo-reserves/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name         |                                                                              Description                                                                               |  Type  | Options |                     Default                      |
| :-------: | :-----------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------------------: |
|           |    API_ENDPOINT     |                                                                   An API endpoint for Data Provider                                                                    | string |         | `https://reserves.usdstandard-test.com/por.json` |
|    ✅     | VERIFICATION_PUBKEY | Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\n...contents...\n-----END PUBLIC KEY-----" | string |         |                                                  |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             10              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves"
  }
}
```

---

MIT License
