# Chainlink External Adapter for querying Terra view functions

Version: 1.2.11

This external adapter allows querying contracts on the Terra blockchain. A list of public endpoints can be found [here](https://docs.terra.money/Reference/endpoints.html). Please only use these for testing, not in production, as they are not secure.

Note: The old `RPC_URL` environment variables are still supported, however, please the `LCD_URL` ones below instead.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                                     Description                                                      |  Type  | Options |   Default    |
| :-------: | :----------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------: |
|    ✅     | COLUMBUS_5_LCD_URL | The URL to a Terra `columbus-5` full node to query on-chain mainnet data. At least 1 of 3 LCD_URLs must be provided. | string |         |              |
|    ✅     | BOMBAY_12_LCD_URL  | The URL to a Terra `bombay-12` full node to query on-chain testnet data. At least 1 of 3 LCD_URLs must be provided.  | string |         |              |
|    ✅     | LOCALTERRA_LCD_URL |   The URL to a locally running Terra full node to query on-chain data. At least 1 of 3 LCD_URLs must be provided.    | string |         |              |
|           |  DEFAULT_CHAIN_ID  |                               The default `chainId` value to use as an input parameter                               | string |         | `columbus-5` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [view](#view-endpoint) | `view`  |

---

## View Endpoint

`view` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    |  Aliases   |                                                           Description                                                            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  address   | `contract` |                                                       The address to query                                                       | string |         |         |            |                |
|    ✅     |   query    |            |                                                         The query object                                                         |        |         |         |            |                |
|           |   params   |            |                                          Optional params object to include in the query                                          |        |         |         |            |                |
|           |  chainId   |            | Which chain ID to connect to. Default is `DEFAULT_CHAIN_ID` environment variable (`columbus-5`, `bombay-12`, `localterra`, etc.) | string |         |         |            |                |
|           | resultPath |            |         The object-path string to parse a single `result` value. When not provided the entire response will be provided.         | string |         |         |            |                |

### Example

Request:

```json
{
  "jobID": "1",
  "data": {
    "address": "terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts",
    "query": {
      "state": {}
    }
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "result": {
    "bluna_exchange_rate": "1.000007186291211709",
    "stluna_exchange_rate": "1.025963605883917253",
    "total_bond_bluna_amount": "84019024161042",
    "total_bond_stluna_amount": "2620798650161",
    "last_index_modification": 1650611699,
    "prev_hub_balance": "293112080103",
    "last_unbonded_time": 1650382207,
    "last_processed_batch": 125,
    "total_bond_amount": "84019024161042",
    "exchange_rate": "1.000007186291211709"
  },
  "statusCode": 200,
  "data": {
    "result": {
      "bluna_exchange_rate": "1.000007186291211709",
      "stluna_exchange_rate": "1.025963605883917253",
      "total_bond_bluna_amount": "84019024161042",
      "total_bond_stluna_amount": "2620798650161",
      "last_index_modification": 1650611699,
      "prev_hub_balance": "293112080103",
      "last_unbonded_time": 1650382207,
      "last_processed_batch": 125,
      "total_bond_amount": "84019024161042",
      "exchange_rate": "1.000007186291211709"
    }
  }
}
```

---
