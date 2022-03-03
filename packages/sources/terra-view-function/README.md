# Chainlink External Adapter for querying Terra view functions

This external adapter allows querying contracts on the Terra blockchain.

### Environment Variables

- Note: The old `RPC_URL` environment variables are still supported, however, please the `LCD_URL` ones below instead.

| Required? |        Name        |                               Description                                | Options | Defaults to  |
| :-------: | :----------------: | :----------------------------------------------------------------------: | :-----: | :----------: |
|    ✅     | COLUMBUS_5_LCD_URL | The URL to a Terra `columbus-5` full node to query on-chain mainnet data |         |              |
|    ✅     | BOMBAY_12_LCD_URL  | The URL to a Terra `bombay-12` full node to query on-chain testnet data  |         |              |
|    ✅     | LOCALTERRA_LCD_URL |   The URL to a locally running Terra full node to query on-chain data    |         |              |
|           |  DEFAULT_CHAIN_ID  |         The default `chainId` value to use as an input parameter         |         | `columbus-5` |

A list of public endpoints can be found [here](https://docs.terra.money/Reference/endpoints.html). Please only use these for testing, not in production, as they are not secure.

---

### Input Parameters

| Required? |   Name   |     Description     |        Options         | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------: | :---------: |
|           | endpoint | The endpoint to use | [view](#View-Endpoint) |    view     |

---

## View Endpoint

### Input Params

| Required? |          Name           |                                                                           Description                                                                            |                 Options                 |               Defaults to               |
| :-------: | :---------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------: | :-------------------------------------: |
|    ✅     | `address` or `contract` |                                                                       The address to query                                                                       |                                         |                                         |
|    ✅     |         `query`         |                                                                         The query object                                                                         |                                         |                                         |
|           |        `params`         |                                                          Optional params object to include in the query                                                          |                                         |                                         |
|           |        `chainId`        |                                                                   Which chain ID to connect to                                                                   | `columbus-5`, `bombay-12`, `localterra` | `DEFAULT_CHAIN_ID` environment variable |
|           |      `resultPath`       | The [object-path](https://github.com/mariocasciaro/object-path) string to parse a single `result` value. When not provided the entire response will be provided. |                                         |                                         |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "address": "terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy",
    "query": { "aggregator_query": { "get_latest_round_data": {} } }
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": {
    "round_id": 102560,
    "answer": "455045076819",
    "started_at": 1635942792,
    "updated_at": 1635942797,
    "answered_in_round": 102560
  },
  "statusCode": 200,
  "data": {
    "result": {
      "round_id": 102560,
      "answer": "455045076819",
      "started_at": 1635942792,
      "updated_at": 1635942797,
      "answered_in_round": 102560
    }
  }
}
```
