# Chainlink External Adapter for querying Terra view functions

Version: 1.1.1

This external adapter allows querying contracts on the Terra blockchain. A list of public endpoints can be found [here](https://docs.terra.money/Reference/endpoints.html). Please only use these for testing, not in production, as they are not secure.

## Environment Variables

| Required? |        Name        |                               Description                                |  Type  | Options |   Default    |
| :-------: | :----------------: | :----------------------------------------------------------------------: | :----: | :-----: | :----------: |
|    ✅     | COLUMBUS_5_RPC_URL | The URL to a Terra `columbus-5` full node to query on-chain mainnet data | string |         |              |
|    ✅     | BOMBAY_12_RPC_URL  | The URL to a Terra `bombay-12` full node to query on-chain testnet data  | string |         |              |
|    ✅     | LOCALTERRA_RPC_URL |   The URL to a locally running Terra full node to query on-chain data    | string |         |              |
|           |  DEFAULT_CHAIN_ID  |         The default `chainId` value to use as an input parameter         | string |         | `columbus-5` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [view](#view-endpoint) | `view`  |

---

## View Endpoint

`view` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    |  Aliases   |                                                                           Description                                                                            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :--------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  address   | `contract` |                                                                       The address to query                                                                       | string |         |         |            |                |
|    ✅     |   query    |            |                                                                         The query object                                                                         |        |         |         |            |                |
|           |   params   |            |                                                          Optional params object to include in the query                                                          |        |         |         |            |                |
|           |  chainId   |            |                 Which chain ID to connect to. Default is `DEFAULT_CHAIN_ID` environment variable (`columbus-5`, `bombay-12`, `localterra`, etc.)                 | string |         |         |            |                |
|           | resultPath |            | The [object-path](https://github.com/mariocasciaro/object-path) string to parse a single `result` value. When not provided the entire response will be provided. | string |         |         |            |                |

There are no examples for this endpoint.
