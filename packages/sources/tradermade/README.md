# Chainlink External Adapter for Tradermade

This adapter only has Websocket support for the forex endpoint.

Version: 1.4.2

## Environment Variables

| Required? |     Name     |                                           Description                                           |  Type  | Options |                     Default                     |
| :-------: | :----------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string |         |                                                 |
|           | API_ENDPOINT |                                                                                                 | string |         | `https://marketdata.tradermade.com/api/v1/live` |
|           |  WS_API_KEY  | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string |         |                                                 |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                     Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [live](#live-endpoint), [forex](#forex-endpoint) | `live`  |

---

## Live Endpoint

Supported names for this endpoint are: `live`, `commodities`.

### Input Params

| Required? | Name |          Aliases           |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol`, `market` | The symbol of the currency to query | string |         |         |            |                |
|           |  to  |                            |         The quote currency          | string |         |         |            |                |

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
  "endpoint": "live",
  "quotes": [
    {
      "ask": 150.51,
      "bid": 150.5,
      "instrument": "AAPL",
      "mid": 150.50501
    }
  ],
  "requested_time": "Fri, 05 Nov 2021 17:12:07 GMT",
  "timestamp": 1636132328,
  "result": 150.50501
}
```

---

## Forex Endpoint

`forex` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases           |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `symbol`, `market` | The symbol of the currency to query |      |         |         |            |                |
|    ✅     | quote | `to`, `market`, `convert`  |         The quote currency          |      |         |         |            |                |

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
