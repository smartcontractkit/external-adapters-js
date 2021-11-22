# @chainlink/readme-test-adapter

Version: 1.2.3

This is a fake adapter for testing, and should not be used as a template for adapters.

## Environment Variables

| Required? |     Name     |                                                Description                                                 |  Type  |          Options          |             Default              |
| :-------: | :----------: | :--------------------------------------------------------------------------------------------------------: | :----: | :-----------------------: | :------------------------------: |
|           | API_ENDPOINT |                                            API Endpoint to use                                             | string |                           | `https://test.api.endpoint.link` |
|           |   CHAIN_ID   |                                Chain ID (`1 = Mainnet`, `2 = Testnet`, ...)                                | number |                           |               `1`                |
|           |     MODE     | API Mode has `live` for live data, `sandbox` for development, and `test` for live-like environment testing | string | `live`, `sandbox`, `test` |            `sandbox`             |
|    ✅     | PRIVATE_KEY  |                                          Private subscription key                                          | string |                           |                                  |
|    ✅     |   RPC_URL    |                                            RPC Endpoint to use                                             | string |                           |                                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                         Options                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [marketcap](#marketcap-endpoint), [price](#price-endpoint) | `balance` |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      |                               Description                               |  Type  | Options |   Default   |
| :-------: | :-----------: | :---------------------------------------------------------------------: | :----: | :-----: | :---------: |
|           |   dataPath    |                     Path for balance data response.                     | string |         | `addresses` |
|           | confirmations | Number of confirmations for transactions to add to balance calculation. | number |         |     `4`     |
|           |   addresses   |                       List of addresses to query.                       |  list  |         |             |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "dataPath": "addresses",
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
      }
    ]
  }
}
```

Response:

```json
{
  "responses": [
    {
      "status": 200,
      "title": "OK",
      "description": "Successful request",
      "payload": {
        "address": {
          "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
        },
        "blockchainId": "408fa195a34b533de9ad9889f076045e",
        "blockNumber": "693286",
        "timestampNanoseconds": 0,
        "value": "2188",
        "timestamp": "2021-07-29T20:54:39.000Z"
      }
    }
  ],
  "result": [
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "chain": "mainnet",
      "coin": "btc",
      "balance": "2188"
    }
  ]
}
```

---

## Marketcap Endpoint

Supported names for this endpoint are: `marketcap`, `mc`.

### Input Params

| Required? |         Name          |                                Description                                |  Type  | Options |   Default   |
| :-------: | :-------------------: | :-----------------------------------------------------------------------: | :----: | :-----: | :---------: |
|    ✅     |         base          |  Base asset to query. Available param names are: `base`, `from`, `coin`.  | string |         |    `BTC`    |
|    ✅     |         quote         | Quote asset to query. Available param names are: `quote`, `to`, `market`. | string |         |    `USD`    |
|    ✅     |        coinid         |                             ID of main coin.                              | number |         |  `1 (BTC)`  |
|           |      resultPath       |                     Path for marketcap data response.                     | string |         | `marketcap` |
|           | referenceCurrencyUuid |           UUID of reference currency (meaningless input param).           | number |         |     `0`     |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "base": "BTC",
    "quote": "USD",
    "coinid": "Bitcoin",
    "resultPath": "marketcap"
  }
}
```

Response:

```json
{
  "marketcap": 1000000000,
  "result": 1000000000
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "mc",
    "base": "BTC",
    "quote": "USD",
    "coinid": "Bitcoin",
    "resultPath": "marketcap"
  }
}
```

Response:

```json
{
  "marketcap": 1000000000,
  "result": 1000000000
}
```

</details>

---

## Price Endpoint

Supported names for this endpoint are: `price`, `convert`.

### Input Params

| Required? |    Name    |                                Description                                |  Type  | Options | Default |
| :-------: | :--------: | :-----------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |    base    |  Base asset to query. Available param names are: `base`, `from`, `coin`.  | string |         |  `BTC`  |
|    ✅     |   quote    | Quote asset to query. Available param names are: `quote`, `to`, `market`. | string |         |  `USD`  |
|           |   amount   |            Amount of asset to query (meaningless input param).            | number |         |         |
|           | resultPath |                       Path for price data response.                       | string |         | `price` |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "BTC",
    "quote": "USD",
    "resultPath": "price"
  }
}
```

Response:

```json
{
  "price": 123456,
  "result": 123456
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "convert",
    "base": "BTC",
    "quote": "USD",
    "resultPath": "price"
  }
}
```

Response:

```json
{
  "price": 123456,
  "result": 123456
}
```

</details>
