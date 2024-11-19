# DXFEED

![2.0.26](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dxfeed/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |         Description          |  Type  | Options |                  Default                   |
| :-------: | :-------------: | :--------------------------: | :----: | :-----: | :----------------------------------------: |
|           |  API_USERNAME   |   username for dxfeed API    | string |         |                                            |
|           |  API_PASSWORD   |   password for dxfeed API    | string |         |                                            |
|           | WS_API_ENDPOINT | The websocket url for dxfeed | string |         |                                            |
|           |  API_ENDPOINT   |    The API url for dxfeed    | string |         | `https://tools.dxfeed.com/webservice/rest` |

---

## Data Provider Rate Limits

|   Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                 Note                                 |
| :-------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------------------: |
| unlimited |             100             |                             |                           | Dxfeed does not describe a rate limit, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#price-endpoint), [crypto](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `commodities`, `crypto`, `forex`, `price`, `stock`.

### Input Params

| Required? | Name |         Aliases          |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "TSLA"
  }
}
```

---

MIT License
