# HASTRA

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/hastra/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |        Description         |  Type  | Options | Default |
| :-------: | :----------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_ENDPOINT | The API endpoint of Hastra | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             20              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                    Options                     |      Default       |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [accrued-interest](#accrued-interest-endpoint) | `accrued-interest` |

## Accrued-interest Endpoint

`accrued-interest` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                          Description                          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :-----------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | contractAddress |         | The contract address of the token to get accrued interest for | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "accrued-interest",
    "contractAddress": "E123456789qwertyuiopASDFGHJKLzxcvbnm12345678"
  }
}
```

---

MIT License
