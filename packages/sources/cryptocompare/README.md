# Chainlink External Adapter for CryptoCompare

### Environment Variables

| Required? |  Name   |                                      Description                                       | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://min-api.cryptocompare.com/pricing) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [multi](#Multi-Endpoint), [price](#Marketcap-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../external-adapter/src/overrides/presetSymbols.json)|             |

### Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "USD": 164.02,
    "result": 164.02
  },
  "statusCode": 200
}
```

## Multi Endpoint

Fetch one or multiple assets in a single query
### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol or array of symbols of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |

```json
{
  "jobId": "1",
  "data": {
    "base": [
      "ETH",
      "BTC"
    ],
    "quote": "USD",
    "endpoint": "multi"
  }
}
```
### Output

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "data": {
    "payload": {
      "ETH": {
        "quote": {
          "USD": {
            "price": 1545.04
          }
        }
      },
      "BTC": {
        "quote": {
          "USD": {
            "price": 48903.23
          }
        }
      }
    }
  }
}
```

## Marketcap Endpoint

Fetch one or multiple assets market cap in a single query
### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol or array of symbols of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |

```json
{
  "jobId": "1",
  "data": {
    "base": [
      "ETH",
      "BTC"
    ],
    "quote": "USD",
    "endpoint": "marketcap"
  }
}
```
### Output

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "data": {
    "payload": {
      "ETH": {
        "quote": {
          "USD": {
            "marketCap": 176948045078.45853
          }
        }
      },
      "BTC": {
        "quote": {
          "USD": {
            "marketCap": 910222675769.08
          }
        }
      }
    }
  }
}
```
