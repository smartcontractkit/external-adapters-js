# Chainlink External Adapter for Layer 2 Sequencer Health Check

Adapter that checks the Layer 2 Sequencer status

### Environment Variables

| Required? |               Name                |                                        Description                                        | Options |                           Defaults to                            |
| :-------: | :-------------------------------: | :---------------------------------------------------------------------------------------: | :-----: | :--------------------------------------------------------------: |
|           |          `DELTA_BLOCKS`           |                Maximum allowed number of blocks that Nodes can fall behind                |         |                                6                                 |
|           |      `NETWORK_TIMEOUT_LIMIT`      |              Maximum time in milliseconds to wait for a transaction receipt               |         |                          5000 (5 secs)                           |
|           |    `ARBITRUM_HEALTH_ENDPOINT`     |                                 Arbitrum Health Endpoint                                  |         |                                                                  |
|           |        `ARBITRUM_CHAIN_ID`        |                            The chain id to connect to Arbitrum                            |         |                              42161                               |
|           |         `ARBITRUM_DELTA`          | Maximum time in milliseconds from last seen block to consider Arbitrum sequencer healthy  |         |                          120000 (2 min)                          |
|           |      `OPTIMISM_RPC_ENDPOINT`      |                                   Optimism RPC Endpoint                                   |         |                   https://mainnet.optimism.io                    |
|           |    `OPTIMISM_HEALTH_ENDPOINT`     |                                 Optimism Health Endpoint                                  |         |                                                                  |
|           |        `OPTIMISM_CHAIN_ID`        |                            The chain id to connect to Optimism                            |         |                                10                                |
|           |         `OPTIMISM_DELTA`          | Maximum time in milliseconds from last seen block to consider Optimism sequencer healthy  |         |                          120000 (2 min)                          |
|           |        `BASE_RPC_ENDPOINT`        |                                     Base RPC Endpoint                                     |         |                     https://mainnet.base.org                     |
|           |      `BASE_HEALTH_ENDPOINT`       |                                   Base Health Endpoint                                    |         |                                                                  |
|           |          `BASE_CHAIN_ID`          |                              The chain id to connect to Base                              |         |                               8453                               |
|           |           `BASE_DELTA`            |   Maximum time in milliseconds from last seen block to consider Base sequencer healthy    |         |                          120000 (2 min)                          |
|           |       `LINEA_RPC_ENDPOINT`        |                                    Linea RPC Endpoint                                     |         |                     https://rpc.linea.build                      |
|           |      `LINEA_HEALTH_ENDPOINT`      |                                   Linea Health Endpoint                                   |         |                                                                  |
|           |         `LINEA_CHAIN_ID`          |                             The chain id to connect to Linea                              |         |                              59144                               |
|           |           `LINEA_DELTA`           |   Maximum time in milliseconds from last seen block to consider Linea sequencer healthy   |         |                          120000 (2 min)                          |
|           |       `METIS_RPC_ENDPOINT`        |                                    Metis RPC Endpoint                                     |         |              https://andromeda.metis.io/?owner=1088              |
|           |      `METIS_HEALTH_ENDPOINT`      |                                   Metis Health Endpoint                                   |         |        https://andromeda-healthy.metisdevops.link/health         |
|           |         `METIS_CHAIN_ID`          |                             The chain id to connect to Metis                              |         |                               1088                               |
|           |           `METIS_DELTA`           |   Maximum time in milliseconds from last seen block to consider Metis sequencer healthy   |         |                         600000 (10 min)                          |
|           |       `SCROLL_RPC_ENDPOINT`       |                                    Scroll RPC Endpoint                                    |         |                      https://rpc.scroll.io                       |
|           |     `SCROLL_HEALTH_ENDPOINT`      |                                  Scroll Health Endpoint                                   |         |           https://venus.scroll.io/v1/sequencer/status            |
|           |         `SCROLL_CHAIN_ID`         |                             The chain id to connect to Scroll                             |         |                              534352                              |
|           |          `SCROLL_DELTA`           |  Maximum time in milliseconds from last seen block to consider Scroll sequencer healthy   |         |                          120000 (2 min)                          |
|           |     `STARKWARE_RPC_ENDPOINT`      |                                  Starkware RPC Endpoint                                   |         |           https://starknet-mainnet.public.blastapi.io            |
|           | `STARKWARE_DUMMY_ACCOUNT_ADDRESS` |             The dummy address to use to send dummy transactions to Starkware              |         | 0x00000000000000000000000000000000000000000000000000000000000001 |
|           |         `STARKWARE_DELTA`         | Maximum time in milliseconds from last seen block to consider Starkware sequencer healthy |         |                          120000 (2 min)                          |
|           | `STARKWARE_DUMMY_ACCOUNT_ADDRESS` |             The dummy address to use to send dummy transactions to Starkware              |         | 0x00000000000000000000000000000000000000000000000000000000000001 |
|           |       `ZKSYNC_RPC_ENDPOINT`       |                                    zkSync RPC Endpoint                                    |         |                  https://mainnet.era.zksync.io                   |
|           |     `ZKSYNC_HEALTH_ENDPOINT`      |                                  zkSync Health Endpoint                                   |         |                                                                  |
|           |         `ZKSYNC_CHAIN_ID`         |                             The chain id to connect to zkSync                             |         |                               324                                |
|           |          `ZKSYNC_DELTA`           |  Maximum time in milliseconds from last seen block to consider zkSync sequencer healthy   |         |                          120000 (2 min)                          |

For the adapter to be useful on the desired network, at least one endpoint (RPC or HEALTH) needs to provided

---

### Input Parameters

| Required? |  Name   |       Description        |                                      Options                                      | Defaults to |
| :-------: | :-----: | :----------------------: | :-------------------------------------------------------------------------------: | :---------: |
|    ✅     | network | Layer 2 Network to check | `arbitrum`, `optimism`, `base`, `linea`, `metis`, `scroll`, `starkware`, `zksync` |             |

---

### Sample Input

```json
{
  "id": "1",
  "data": {
    "network": "arbitrum"
  }
}
```

### Sample Output

0 = Sequencer is healthy
1 = Sequencer is unhealthy

```json
{
  "jobRunID": "1",
  "result": 0,
  "statusCode": 200,
  "data": {
    "isHealthy": true,
    "result": 0
  }
}
```
