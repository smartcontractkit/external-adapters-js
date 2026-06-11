# ITICK

![1.1.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/itick/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |              Description              |  Type  | Options |         Default         |
| :-------: | :-------------: | :-----------------------------------: | :----: | :-----: | :---------------------: |
|    ✅     |     API_KEY     | The API key for the data provider API | string |         |                         |
|           |  API_ENDPOINT   |   An API endpoint for Data Provider   | string |         | `https://api.itick.org` |
|           | WS_API_ENDPOINT |     WS endpoint for Data Provider     | string |         |  `wss://api.itick.org`  |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             60              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                        Options                                                                         | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [indices_price](#indices_price-endpoint), [indices_quotes](#indices_quotes-endpoint), [price](#price-endpoint), [stock_quotes](#stock_quotes-endpoint) |         |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "700$hk"
  }
}
```

---

## Indices_price Endpoint

`indices_price` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indices_price",
    "base": "700$hk"
  }
}
```

---

## Stock_quotes Endpoint

`stock_quotes` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock_quotes",
    "base": "700$hk"
  }
}
```

---

## Indices_quotes Endpoint

`indices_quotes` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indices_quotes",
    "base": "700$hk"
  }
}
```

---

MIT License
