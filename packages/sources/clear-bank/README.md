# CLEAR_BANK

![1.0.16](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/clear-bank/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |                  Default                   |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------------: |
|    ✅     |        API_KEY        |                               An API key for Data Provider                                | string |         |                                            |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `https://institution-api.clearbank.co.uk/` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |                  `10000`                   |
|           |       PAGE_SIZE       |      The number of accounts to fetch per call to /accounts. Must be >= 1 and <= 50.       | number |         |                    `50`                    |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                  Note                                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------------------------------------------------: |
| default |              1              |                             |                           | Reasonable rate limit set by default to avoid overwhelming the endpoint |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [accounts](#accounts-endpoint) | `accounts` |

## Accounts Endpoint

`accounts` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    |  Aliases  |                    Description                    |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-------: | :-----------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | accountIDs | `ibanIDs` |           The account ID that balances            | string[] |         |         |            |                |
|           |  currency  |           | The currency the balance should be aggregated for |  string  |         |  `GBP`  |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "accounts",
    "accountIDs": ["GB44CLRB04084000000010"],
    "currency": "GBP"
  }
}
```

---

MIT License
