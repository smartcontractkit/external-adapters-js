# GSR

![2.4.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/gsr/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |             Description              |  Type  | Options |              Default              |
| :-------: | :-------------: | :----------------------------------: | :----: | :-----: | :-------------------------------: |
|           |  API_ENDPOINT   |     The HTTP API endpoint to use     | string |         |  `https://oracle.prod.gsr.io/v1`  |
|           | WS_API_ENDPOINT |      The WS API endpoint to use      | string |         | `wss://oracle.prod.gsr.io/oracle` |
|    ✅     |   WS_USER_ID    |   The user ID used to authenticate   | string |         |                                   |
|    ✅     |  WS_PUBLIC_KEY  | The public key used to authenticate  | string |         |                                   |
|    ✅     | WS_PRIVATE_KEY  | The private key used to authenticate | string |         |                                   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                     Options                                                                                     | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto-lwba](#price-endpoint), [crypto](#price-endpoint), [crypto_lwba](#price-endpoint), [cryptolwba](#price-endpoint), [price-ws](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `crypto-lwba`, `crypto_lwba`, `cryptolwba`, `price`, `price-ws`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

MIT License
