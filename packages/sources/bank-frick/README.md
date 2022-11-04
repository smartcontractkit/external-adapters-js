# Bank Frick Adapter

![0.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bank-frick/package.json)

Adapter for fetching account information from Bank Frick

Base URL https://olbsandbox.bankfrick.li/webapi/v2

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                                             Description                                                              |  Type  | Options |                   Default                   |
| :-------: | :----------: | :----------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------------------: |
|           | API_ENDPOINT |                                                   The URL for the Bank Frick API.                                                    | string |         | `https://olbsandbox.bankfrick.li/webapi/v2` |
|    ✅     |   API_KEY    |                         API key to use. Must be generated in the Bank Frick UI using the PRIVATE_KEY below.                          | string |         |                                             |
|    ✅     | PRIVATE_KEY  | RSA key used to produce and verify signatures when authorizing the client. Can be a raw multiline string or a base64 encoded string. | string |         |                                             |
|           |  PAGE_SIZE   |                           The number of accounts to fetch per call to /accounts. Must be >= 1 and <= 500.                            | number |         |                    `500`                    |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [accounts](#accounts-endpoint) | `accounts` |

## Accounts Endpoint

This endpoint returns the sum of all balances for accounts specified by the user.

`accounts` is the only supported name for this endpoint.

### Input Params

| Required? |       Name       | Aliases |                                                    Description                                                     |  Type  | Options |   Default    | Depends On | Not Valid With |
| :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------: | :--------: | :------------: |
|    ✅     |     ibanIDs      |         |                              The list of account ids included in the sum of balances                               | array  |         |              |            |                |
|           | signingAlgorithm |         | What signing algorithm is used to sign and verify authorization data, one of rsa-sha256, rsa-sha384, or rsa-sha512 | string |         | `rsa-sha512` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "ibanIDs": ["LI6808811000000012345", "LI6808811000000045345"],
    "signingAlgorithm": "rsa-sha512",
    "endpoint": "accounts",
    "resultPath": "accounts"
  },
  "debug": {
    "cacheKey": "5RayX7lCXMOq+AM5EXTuPMagMhU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": "1010000.0999999"
  },
  "result": "1010000.0999999",
  "statusCode": 200
}
```

---

MIT License
