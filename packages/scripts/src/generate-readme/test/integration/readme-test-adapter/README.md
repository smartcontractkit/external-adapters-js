# @chainlink/readme-test-adapter

Version: 1.2.3

This is a fake adapter for testing, and should not be used as a template for adapters.

## Environment Variables

| Required? |     Name     |  Type  |       Options       |            Default             |
| :-------: | :----------: | :----: | :-----------------: | :----------------------------: |
|           | API_ENDPOINT | string |                     | https://test.api.endpoint.link |
|           |   CHAIN_ID   | number |                     |               1                |
|           |     MODE     | string | live, sandbox, test |            sandbox             |
|    ✅     | PRIVATE_KEY  | string |                     |                                |
|    ✅     |   RPC_URL    | string |                     |                                |

---

## Input Parameters

| Required? |   Name   |  Type  |                                         Options                                          | Default |
| :-------: | :------: | :----: | :--------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | string | [balance](#balance-endpoint), [marketcap](#marketcap-endpoint), [price](#price-endpoint) | balance |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Type | Options | Default |
| :-------: | :-----------: | :--: | :-----: | :-----: |
|           |   dataPath    |      |         |         |
|           | confirmations |      |         |         |
|           |   addresses   |      |         |         |

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

| Required? |         Name          | Type |         Options         | Default |
| :-------: | :-------------------: | :--: | :---------------------: | :-----: |
|    ✅     |         base          |      | `base`, `from`, `coin`  |         |
|    ✅     |         quote         |      | `quote`, `to`, `market` |         |
|    ✅     |        coinid         |      |                         |         |
|           |      resultPath       |      |                         |         |
|           | referenceCurrencyUuid |      |                         |         |

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

| Required? |    Name    | Type |         Options         | Default |
| :-------: | :--------: | :--: | :---------------------: | :-----: |
|    ✅     |    base    |      | `base`, `from`, `coin`  |         |
|    ✅     |   quote    |      | `quote`, `to`, `market` |         |
|           |   amount   |      |                         |         |
|           | resultPath |      |                         |         |

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
