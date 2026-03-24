# ITICK

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/itick/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options |         Default         |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :---------------------: |
|           |   API_KEY_HK    |    The API key for region 'HK'    | string |         |                         |
|           |   API_KEY_CN    |    The API key for region 'CN'    | string |         |                         |
|           |   API_KEY_GB    |    The API key for region 'GB'    | string |         |                         |
|           |   API_KEY_KR    |    The API key for region 'KR'    | string |         |                         |
|           |   API_KEY_JP    |    The API key for region 'JP'    | string |         |                         |
|           |   API_KEY_TW    |    The API key for region 'TW'    | string |         |                         |
|           |  API_ENDPOINT   | An API endpoint for Data Provider | string |         | `https://api.itick.org` |
|           | WS_API_ENDPOINT |   WS endpoint for Data Provider   | string |         |  `wss://api.itick.org`  |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             60              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                      Options                                                                                                                                                                                                       | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [cn-depth](#cn-depth-endpoint), [cn-quote](#cn-quote-endpoint), [hk-depth](#hk-depth-endpoint), [hk-quote](#hk-quote-endpoint), [indices-depth](#indices-depth-endpoint), [indices-quote](#indices-quote-endpoint), [jp-depth](#jp-depth-endpoint), [jp-quote](#jp-quote-endpoint), [kr-depth](#kr-depth-endpoint), [kr-quote](#kr-quote-endpoint), [tw-depth](#tw-depth-endpoint), [tw-quote](#tw-quote-endpoint) |         |

## Hk-depth Endpoint

`hk-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "hk-depth",
    "symbol": "700"
  }
}
```

---

## Cn-depth Endpoint

`cn-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "cn-depth",
    "symbol": "700"
  }
}
```

---

## Indices-depth Endpoint

`indices-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indices-depth",
    "symbol": "700"
  }
}
```

---

## Kr-depth Endpoint

`kr-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "kr-depth",
    "symbol": "700"
  }
}
```

---

## Jp-depth Endpoint

`jp-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "jp-depth",
    "symbol": "700"
  }
}
```

---

## Tw-depth Endpoint

`tw-depth` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "tw-depth",
    "symbol": "700"
  }
}
```

---

## Hk-quote Endpoint

`hk-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "hk-quote",
    "symbol": "700"
  }
}
```

---

## Cn-quote Endpoint

`cn-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "cn-quote",
    "symbol": "700"
  }
}
```

---

## Indices-quote Endpoint

`indices-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "indices-quote",
    "symbol": "700"
  }
}
```

---

## Kr-quote Endpoint

`kr-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "kr-quote",
    "symbol": "700"
  }
}
```

---

## Jp-quote Endpoint

`jp-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "jp-quote",
    "symbol": "700"
  }
}
```

---

## Tw-quote Endpoint

`tw-quote` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol of the stock to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "tw-quote",
    "symbol": "700"
  }
}
```

---

MIT License
