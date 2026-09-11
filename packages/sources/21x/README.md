# 21X

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/21x/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |                    Default                    |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------------------: |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `https://trading.21x.eu/api/v1/tradingpairs/` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |                    `10000`                    |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             300             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases |        Description         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base |  `id`   | The id of the trading pair | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "09befe9e-c95d-4856-ab4c-c811202a9cfb"
  }
}
```

---

MIT License
