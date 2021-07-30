# Chainlink Polygon External Adapter

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint.

### Environment Variables

| Required? |  Name   |                                   Description                                    | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [forex](#Forex-Endpoint) |    forex    |

---

## Forex Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.
Get FOREX price conversions

### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                 `BTC`, `ETH`, `USD`                                  |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          |                                 `BTC`, `ETH`, `USD`                                  |             |
|    🟡     |          `amount`          |            The amount of the `base` to convert            |                                                                                      |      1      |
|    🟡     |        `precision`         |       The number of significant figures to include        |                                                                                      |      4      |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "last": {
      "bid": 0.8131,
      "ask": 0.8133,
      "exchange": 48,
      "timestamp": 1587501544000
    },
    "from": "GBP",
    "to": "USD",
    "initialAmount": 1,
    "converted": 1.2299,
    "result": 1.2299
  },
  "result": 1.2299,
  "statusCode": 200
}
```
