# ALENO

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/aleno/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |              Default              |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |        API_KEY        |                                   An API key for Aleno                                    | string |         |                                   |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         |  `https://state-price.aleno.ai`   |
|           |    WS_API_ENDPOINT    |                                   WS endpoint for Aleno                                   | string |         | `https://ws-state-price.aleno.ai` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |              `10000`              |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             30              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                    Options                                    | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#price-endpoint), [price](#price-endpoint), [state](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `price`, `state`.

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
    "base": "FRAX",
    "quote": "USD"
  }
}
```

---

MIT License
