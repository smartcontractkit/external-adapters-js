# ITICK

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/itick/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

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

| Required? |   Name   |     Description     |  Type  |                                                                            Options                                                                             | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [indices-depth](#indices-depth-endpoint), [indices-quote](#indices-quote-endpoint), [stock-depth](#stock-depth-endpoint), [stock-quote](#stock-quote-endpoint) |         |

## Stock-depth Endpoint

`stock-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases  |                          Description                          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------: | :-----------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `symbol` |               The symbol of the stock to query                | string |         |         |            |                |
|    ✅     | region |          | The code of the stock exchange region (e.g. "hk", "kr", "jq") | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock-depth",
    "base": "700",
    "region": "hk"
  }
}
```

---

## Indices-depth Endpoint

`indices-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases  |                          Description                          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------: | :-----------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `symbol` |               The symbol of the stock to query                | string |         |         |            |                |
|    ✅     | region |          | The code of the stock exchange region (e.g. "hk", "kr", "jq") | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indices-depth",
    "base": "700",
    "region": "hk"
  }
}
```

---

## Stock-quote Endpoint

`stock-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases  |                          Description                          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------: | :-----------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `symbol` |               The symbol of the stock to query                | string |         |         |            |                |
|    ✅     | region |          | The code of the stock exchange region (e.g. "hk", "kr", "jq") | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock-quote",
    "base": "700",
    "region": "hk"
  }
}
```

---

## Indices-quote Endpoint

`indices-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases  |                          Description                          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------: | :-----------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `symbol` |               The symbol of the stock to query                | string |         |         |            |                |
|    ✅     | region |          | The code of the stock exchange region (e.g. "hk", "kr", "jq") | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indices-quote",
    "base": "700",
    "region": "hk"
  }
}
```

---

MIT License
