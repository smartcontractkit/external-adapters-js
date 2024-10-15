# DLC_BTC_POR

![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

## Environment Variables

| Required? |          Name          |                                        Description                                        |  Type  |             Options             |  Default  |
| :-------: | :--------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----------------------------: | :-------: |
|    ✅     |   {NETWORK}\_RPC_URL   |            RPC url for a NETWORK. NETWORK is the value of network input param             | string |                                 |           |
|    ✅     |  {NETWORK}\_CHAIN_ID   |            Chain id for a NETWORK. NETWORK is the value of network input param            | string |                                 |           |
|    ✅     |    BITCOIN_RPC_URL     |                                THE RPC URL of bitcoin node                                | string |                                 |           |
|           |   EVM_RPC_BATCH_SIZE   |                  Number of vaults to fetch from a DLC contract at a time                  | number |                                 |   `100`   |
|           |    BITCOIN_NETWORK     |                                   Bitcoin network name                                    |  enum  | `mainnet`, `regtest`, `testnet` | `mainnet` |
|           |     CONFIRMATIONS      |                      The number of confirmations to query data from                       | number |                                 |    `6`    |
|           | BITCOIN_RPC_GROUP_SIZE |         The number of concurrent RPC calls to BITCOIN_RPC_URL to make at a time.          | number |                                 |   `30`    |
|           | BACKGROUND_EXECUTE_MS  | The amount of time the background execute should sleep before performing the next request | number |                                 |  `10000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |            Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :-------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   network   |         |   The name of the RPC network.    | string |         |         |            |                |
|    ✅     | dlcContract |         | Contract address to fetch vaults. | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves",
    "network": "arbitrum",
    "dlcContract": "0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2"
  }
}
```

---

MIT License
