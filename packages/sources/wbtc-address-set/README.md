# Chainlink External Adapters for querying wBTC custodial address set

Version: 1.3.15

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |        Name        |                                  Description                                  |  Type  | Options | Default |
| :-------: | :----------------: | :---------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           |  MEMBERS_ENDPOINT  | wBTC endpoint of members (and their addresses). Required for members endpoint | string |         |         |
|           | ADDRESSES_ENDPOINT |          wBTC endpoint of addresses. Required for addresses endpoint          | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                            Options                             |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [addresses](#addresses-endpoint), [members](#members-endpoint) | `addresses` |

---

## Addresses Endpoint

`addresses` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "addresses"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "id": "601c5e4b11b1d4001e37091aa2618ee9",
        "address": "31h6SJ58NqVrifuyXN5A19ByD6vgyKVHEY",
        "balance": "0",
        "type": "custodial",
        "verified": false,
        "coin": "btc",
        "chainId": "mainnet",
        "network": "bitcoin"
      }
    ],
    "count": 1
  },
  "result": [
    {
      "id": "601c5e4b11b1d4001e37091aa2618ee9",
      "address": "31h6SJ58NqVrifuyXN5A19ByD6vgyKVHEY",
      "balance": "0",
      "type": "custodial",
      "verified": false,
      "coin": "btc",
      "chainId": "mainnet",
      "network": "bitcoin"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Members Endpoint

`members` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "members"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "id": "601323767069d60008cb538b32c33cb1",
        "address": "3Lto4jAz1aGJQwNSAZ6TEEFuoHoBb8kRc7",
        "type": "custodial",
        "balance": "0",
        "verified": false,
        "coin": "btc",
        "chainId": "mainnet",
        "network": "bitcoin"
      }
    ],
    "count": 1
  },
  "result": [
    {
      "id": "601323767069d60008cb538b32c33cb1",
      "address": "3Lto4jAz1aGJQwNSAZ6TEEFuoHoBb8kRc7",
      "type": "custodial",
      "balance": "0",
      "verified": false,
      "coin": "btc",
      "chainId": "mainnet",
      "network": "bitcoin"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
