# Chainlink External Adapter for querying Terra view functions

Version: 1.2.6

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
  "id": "1",
  "data": {
    "endpoint": "view",
    "address": "terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy",
    "query": {
      "aggregator_query": {
        "get_latest_round_data": {}
      }
    }
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": {
      "round_id": 102601,
      "answer": "450925174149",
      "started_at": 1635943989,
      "updated_at": 1635943989,
      "answered_in_round": 102601
    }
  },
  "result": {
    "round_id": 102601,
    "answer": "450925174149",
    "started_at": 1635943989,
    "updated_at": 1635943989,
    "answered_in_round": 102601
  },
  "statusCode": 200
}
```

---
