# EXCHANGE_COPTER

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/exchange-copter/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                      Description                      |  Type  | Options |                    Default                    |
| :-------: | :----------: | :---------------------------------------------------: | :----: | :-----: | :-------------------------------------------: |
|           | API_ENDPOINT | API Endpoint to use for Exchange Copter ARSx reserves | string |         | `https://api.exchangecopter.com/arsx/reserve` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             30              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                  Options                                  |    Default     |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------: | :------------: |
|           | endpoint | The endpoint to use | string | [reserve](#totalreserve-endpoint), [totalreserve](#totalreserve-endpoint) | `totalreserve` |

## Totalreserve Endpoint

Supported names for this endpoint are: `reserve`, `totalreserve`.

### Input Params

| Required? |       Name       | Aliases |                                                                   Description                                                                    |  Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   accountName    |         |                                                      The account name to query reserves for                                                      | string  |         |         |            |                |
|           | noErrorOnRipcord |         | Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset | boolean |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "totalreserve",
    "accountName": "Arsx Base Testnet",
    "noErrorOnRipcord": false
  }
}
```

---

MIT License
