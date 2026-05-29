# IX_TRUST-SYNC

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ix-trust-sync/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |               Description                |  Type  | Options |                                Default                                 |
| :-------: | :----------: | :--------------------------------------: | :----: | :-----: | :--------------------------------------------------------------------: |
|    ✅     |   API_KEY    | The API token to access the Turso DB API | string |         |                                                                        |
|           | API_ENDPOINT |   The URL of the Turso DB API endpoint   | string |         | `https://ion-digital-prod-austpryb.aws-us-east-1.turso.io/v2/pipeline` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                    Options                     |      Default       |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [cumulativeamount](#cumulativeamount-endpoint) | `cumulativeamount` |

## Cumulativeamount Endpoint

`cumulativeamount` is the only supported name for this endpoint.

### Input Params

| Required? |           Name            | Aliases |                                        Description                                         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------------: | :-----: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |      auditorAddress       |         | The address that should have been used to sign the message reporting the cumulative amount | string |         |         |            |                |
|    ✅     | fractionalContractAddress |         |                 Contract address for which to query the cumulative amount                  | string |         |         |            |                |
|    ✅     |          chainId          |         |               The chain ID of the blockchain where the contract is deployed                | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "cumulativeamount",
    "auditorAddress": "0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc",
    "fractionalContractAddress": "0xd051c326C9Aef673428E6F01eb65d2C52De95D30",
    "chainId": 1
  }
}
```

---

MIT License
