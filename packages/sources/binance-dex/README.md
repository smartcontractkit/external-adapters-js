# Chainlink External Adapter for Binance DEX

Version: 1.2.16

The following `base` and `quote` pair must be taken from [this list](https://dex.binance.org/api/v1/markets)

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     |                 Description                  |  Type  |                                               Options                                                |      Default      |
| :-------: | :----------: | :------------------------------------------: | :----: | :--------------------------------------------------------------------------------------------------: | :---------------: |
|           | API_ENDPOINT | env variable to set the API endpoint to use. | string | `dex-asiapacific`, `dex-atlantic`, `dex-european`, `testnet-dex-asiapacific`, `testnet-dex-atlantic` | `dex-asiapacific` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "BUSD-BD1",
    "quote": "USDT-6D8"
  },
  "rateLimitMaxAge": 222
}
```

Response:

```json
{
  "result": 1
}
```

---
