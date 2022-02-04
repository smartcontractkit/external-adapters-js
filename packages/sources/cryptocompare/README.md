# Chainlink External Adapter for CryptoCompare

### Environment Variables

| Required? |  Name   |                                      Description                                       | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | API_KEY | An API key that can be obtained from [here](https://min-api.cryptocompare.com/pricing) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                               Options                                               | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint), [marketcap](#Marketcap-Endpoint), [vwap or crypto-vwap](#Vwap-Endpoint) |  `crypto`   |

---

## Crypto Endpoint

##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.

### Input Params

| Required? |          Name           |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :---------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|    🟡     |       `overrides`       | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "USD": 164.02,
    "result": 164.02
  },
  "statusCode": 200
}
```

## Marketcap Endpoint

### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |

### Sample Input

```json
{
  "jobId": "1",
  "data": {
    "base": "BTC",
    "quote": "USD",
    "endpoint": "marketcap"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "result": 891651422525.12,
  "data": {
    "result": 891651422525.12
  }
}
```

## Volume Endpoint

Fetch one or multiple assets for volume

### Input Params

| Required? |          Name           |                   Description                    | Options | Defaults to |
| :-------: | :---------------------: | :----------------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |       The symbol of the currency to query        |         |             |
|    ✅     | `quote`, `to`, `market` |     The symbol of the currency to convert to     |         |             |
|           |        `coinid`         | The coin ID (optional to use in place of `base`) |         |             |

### Sample Input

```json
{
  "jobId": "1",
  "data": {
    "endpoint": "volume",
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": 142754466.69826838
  },
  "result": 142754466.69826838,
  "statusCode": 200
}
```

## Vwap Endpoint

Aliases: vwap, crypto-vwap

### Input Params

| Required? |          Name           |                Description                | Options | Defaults to |
| :-------: | :---------------------: | :---------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |    The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to  |         |             |
|           |         `hours`         | Number of hours to calculate the VWAP for |         |    `24`     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "AMPL",
    "to": "USD",
    "endpoint": "vwap"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 0.9438,
  "providerStatusCode": 200,
  "statusCode": 200,
  "data": {
    "result": 0.9438
  }
}
```
