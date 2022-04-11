# Chainlink Tiingo External Adapter

### Environment Variables

| Required? |  Name   |                                            Description                                             | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://api.tiingo.com/documentation/general/overview) |         |             |

#### Websocket support

The Tiingo WS does not support aggregated updates for anything other than crypto prices. Enabling WS for anything other
than this should be proceeded with caution.

---

### Input Parameters

| Required? |   Name   |     Description     |                                                                                                                            Options                                                                                                                             | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [`eod`](#EOD-Endpoint), [`iex` or `stock`](#IEX-Endpoint), [`top`](#Top-Endpoint), [`prices` or `crypto`](#Prices-Endpoint), [`volume`](#Volume-Endpoint), [`forex`, `fx` or `commodities`](#Forex-Endpoint), [`vwap` or `crypto-vwap`](#Crypto-Vwap-Endpoint) |  `crypto`   |

---

## EOD Endpoint

https://api.tiingo.com/documentation/end-of-day

### Input Params

| Required? |                Name                 |        Description        | Options | Defaults to |
| :-------: | :---------------------------------: | :-----------------------: | :-----: | :---------: |
|    ✅     | `ticker`, `base`, `from`, or `coin` | The stock ticker to query |         |             |
|           |               `field`               |    The value to return    |         |   `close`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "ticker": "aapl",
    "field": "close"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 130.27
  },
  "result": 130.27,
  "statusCode": 200
}
```

---

## IEX Endpoint

https://api.tiingo.com/documentation/iex

### Input Params

| Required? |                Name                 |        Description        | Options | Defaults to |
| :-------: | :---------------------------------: | :-----------------------: | :-----: | :---------: |
|    ✅     | `ticker`, `base`, `from`, or `coin` | The stock ticker to query |         |             |
|           |               `field`               |    The value to return    |         | `tngoLast`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "ticker": "aapl"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 130.125,
  "statusCode": 200,
  "data": {
    "result": 130.125
  }
}
```

---

## Top Endpoint

The top of order book endpoint from:

https://api.tiingo.com/documentation/crypto

### Input Params

| Required? |            Name            |                Description                 | Options | Defaults to |
| :-------: | :------------------------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |     The cryptocurrency symbol to query     |         |             |
|    ✅     | `quote`, `to`, or `market` | The output currency to return the price in |         |             |
|           |          `field`           |            The value to return             |         | `lastPrice` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "btc",
    "quote": "usd"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 130.27
  },
  "result": 130.27,
  "statusCode": 200
}
```

---

## Prices Endpoint

Crypto prices endpoint from:

https://api.tiingo.com/documentation/crypto

This endpoint does a VWAP of all the exchanges on the current day and across base tokens.

### Input Params

| Required? |            Name            |                Description                 | Options | Defaults to |
| :-------: | :------------------------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |     The cryptocurrency symbol to query     |         |             |
|    ✅     | `quote`, `to`, or `market` | The output currency to return the price in |         |             |
|           |          `field`           |            The value to return             |         | `lastPrice` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "btc",
    "quote": "usd"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 130.27
  },
  "result": 130.27,
  "statusCode": 200
}
```

---

## Volume Endpoint

Crypto prices endpoint from:

https://api.tiingo.com/documentation/crypto

This endpoint gets the 24h volume for a pair

### Input Params

| Required? |            Name            |                Description                 | Options | Defaults to |
| :-------: | :------------------------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |     The cryptocurrency symbol to query     |         |             |
|    ✅     | `quote`, `to`, or `market` | The output currency to return the price in |         |             |
|           |          `field`           |            The value to return             |         | `lastPrice` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "volume",
    "base": "btc",
    "quote": "usd"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 6034249067.971378
  },
  "result": 6034249067.971378,
  "statusCode": 200
}
```

--

## Forex Endpoint

Aliases: `fx`, `commodities`

https://api.tiingo.com/documentation/forex

### Input Params

| Required? |                Name                 |        Description        | Options | Defaults to |
| :-------: | :---------------------------------: | :-----------------------: | :-----: | :---------: |
|    ✅     | `base`, `asset`, `market` or `from` |    The asset to query     |         |             |
|    ✅     |           `quote` or `to`           |  The quote to convert to  |         |             |
|           |            `resultPath`             | The result path to return |         | `midPrice`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "from": "GBP",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1.33605
  },
  "result": 1.33605,
  "statusCode": 200
}
```

## Crypto-Vwap Endpoint

Aliases: vwap, crypto-vwap

Crypto VWAP prices endpoint from:

https://api.tiingo.com/documentation/crypto

### Input Params

| Required? |            Name            |                Description                 | Options | Defaults to |
| :-------: | :------------------------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |     The cryptocurrency symbol to query     |         |             |
|    ✅     | `quote`, `to`, or `market` | The output currency to return the price in |         |             |
|           |        `resultPath`        |            The value to return             |         |  `fxClose`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "AMPL",
    "to": "USD",
    "endpoint": "crypto-vwap"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 0.9435181537600603,
  "providerStatusCode": 200,
  "statusCode": 200,
  "data": {
    "result": 0.9435181537600603
  }
}
```
