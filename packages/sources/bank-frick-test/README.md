# Bank Frick Adapter

Adapter for fetching account information from Bank Frick

Base URL https://olbsandbox.bankfrick.li/webapi/v2

## Environment Variables

| Required? |      Name      |                                                      Description                                                      |  Type   | Options | Default |
| :-------: | :------------: | :-------------------------------------------------------------------------------------------------------------------: | :-----: | :-----: | :-----: |
|    ✅     |    API_KEY     |                  API key to use. Must be generated in the Bank Frick UI using the PRIVATE_KEY below.                  | string  |         |         |
|    ✅     |    PASSWORD    |                                         Password for the Bank Frick account.                                          | string  |         |         |
|    ✅     |  PRIVATE_KEY   |                      RSA key used to produce and verify signatures when authorizing the client.                       | string  |         |         |
|           |   PAGE_SIZE    |                    The number of accounts to fetch per call to /accounts. Must be >= 1 and <= 500.                    | number  |         |  `500`  |
|           | ALLOW_INSECURE | Allows skipping cert verification, useful when running against the sandbox. Only available when NODE_ENV=development. | boolean |         |         |

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
    "result": 1010000.0999999
  },
  "result": 1010000.0999999,
  "statusCode": 200
}
```

---

MIT License
