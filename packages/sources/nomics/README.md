# Chainlink External Adapter for Nomics

Version: 1.0.32

An API key that can be obtained from [here](https://p.nomics.com/pricing#free-plan)

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |           Default           |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------: |
|    ✅     |   API_KEY    |             | string |         |                             |
|           | API_ENDPOINT |             | string |         | `https://api.nomics.com/v1` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                            Options                                                                                             | Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [filtered](#filtered-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

---

## Globalmarketcap Endpoint

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "globalmarketcap"
  }
}
```

Response:

```json
{
  "result": 2810702841731
}
```

---

## Crypto Endpoint

The `crypto` endpoint fetches the price of a requested asset, the `marketcap` endpoint fetches the market cap of the requested asset, and the `volume` endpoint fetches the volume of the requested pair of assets for past 24-hr.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? | Name  |          Aliases          |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |   `coin`, `from`, `ids`   |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "price",
    "base": "BTC",
    "quote": "EUR"
  }
}
```

Response:

```json
{
  "result": 53835.22386957
}
```

---

## Filtered Endpoint

Fetches the price of an asset using specified exchanges.

`filtered` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |       Aliases        |              Description               | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------------: | :------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `coin`, `from`, `id` |  The symbol of the currency to query   |      |         |         |            |                |
|    ✅     | exchanges |                      | Comma delimited list of exchange names |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "filtered",
    "resultPath": "price",
    "base": "LINK",
    "exchanges": "binance,coinbase"
  }
}
```

Response:

```json
{
  "result": 77.77
}
```

---
