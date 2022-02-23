# Chainlink External Adapter for Tradermade

This adapter only has Websocket support for the forex endpoint.

Version: 1.6.13

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     |                                           Description                                           |  Type  | Options |                     Default                     |
| :-------: | :----------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string |         |                                                 |
|           | API_ENDPOINT |                                                                                                 | string |         | `https://marketdata.tradermade.com/api/v1/live` |
|           |  WS_API_KEY  | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string |         |                                                 |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                 Options                                                  | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#live-endpoint), [forex](#forex-endpoint), [live](#live-endpoint), [stock](#live-endpoint) | `live`  |

---

## Live Endpoint

Supported names for this endpoint are: `commodities`, `live`, `stock`.

### Input Params

| Required? | Name  |          Aliases           |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |
|           | quote |      `convert`, `to`       |         The quote currency          | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "live",
    "base": "AAPL"
  }
}
```

Response:

```json
{
  "result": 150.50501
}
```

---

## Forex Endpoint

`forex` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases          |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |     `from`, `symbol`      | The symbol of the currency to query |      |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` |         The quote currency          |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "base": "ETH",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "result": 4494.0249
}
```

---
