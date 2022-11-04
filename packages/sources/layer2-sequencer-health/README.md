# Chainlink External Adapter for Layer 2 Sequencer Health Check

Adapter that checks the Layer 2 Sequencer status

### Environment Variables

| Required? |               Name                |                                   Description                                   | Options |                           Defaults to                            |
| :-------: | :-------------------------------: | :-----------------------------------------------------------------------------: | :-----: | :--------------------------------------------------------------: |
|           |              `DELTA`              | Maximum time in milliseconds from last seen block to consider sequencer healthy |         |                          120000 (2 min)                          |
|           |          `DELTA_BLOCKS`           |           Maximum allowed number of blocks that Nodes can fall behind           |         |                                6                                 |
|           |      `NETWORK_TIMEOUT_LIMIT`      |         Maximum time in milliseconds to wait for a transaction receipt          |         |                          5000 (5 secs)                           |
|           |      `ARBITRUM_RPC_ENDPOINT`      |                              Arbitrum RPC Endpoint                              |         |                   https://arb1.arbitrum.io/rpc                   |
|           |    `ARBITRUM_HEALTH_ENDPOINT`     |                            Arbitrum Health Endpoint                             |         |                                                                  |
|           |        `ARBITRUM_CHAIN_ID`        |                           The chain id to connect to                            |         |                              42161                               |
|           |      `OPTIMISM_RPC_ENDPOINT`      |                              Optimism RPC Endpoint                              |         |                   https://mainnet.optimism.io                    |
|           |    `OPTIMISM_HEALTH_ENDPOINT`     |                            Optimism Health Endpoint                             |         |           https://mainnet-sequencer.optimism.io/health           |
|           |        `OPTIMISM_CHAIN_ID`        |                           The chain id to connect to                            |         |                                10                                |
|           |       `METIS_RPC_ENDPOINT`        |                               Metis RPC Endpoint                                |         |              https://andromeda.metis.io/?owner=1088              |
|           |      `METIS_HEALTH_ENDPOINT`      |                              Metis Health Endpoint                              |         |            https://tokenapi.metis.io/andromeda/health            |
|           |         `METIS_CHAIN_ID`          |                           The chain id to connect to                            |         |                               1088                               |
|           |  `STARKWARE_SEQUENCER_ENDPOINT`   |                       The Starkware Sequencer's endpoint                        |         |                https://alpha-mainnet.starknet.io                 |
|           |  `STARKWARE_FEEDER_GATEWAY_URL`   |                  The Starkware Sequencer's feeder gateway URL                   |         |                          feeder_gateway                          |
|           |      `STARKWARE_GATEWAY_URL`      |                      The Starkware Sequencer's gateway URL                      |         |                             gateway                              |
|           | `STARKWARE_DUMMY_ACCOUNT_ADDRESS` |        The dummy address to use to send dummy transactions to Starkware         |         | 0x00000000000000000000000000000000000000000000000000000000000001 |

For the adapter to be useful on the desired network, at least one endpoint (RPC or HEALTH) needs to provided

---

### Input Parameters

| Required? |  Name   |       Description        |                   Options                    | Defaults to |
| :-------: | :-----: | :----------------------: | :------------------------------------------: | :---------: |
|    ✅     | network | Layer 2 Network to check | `arbitrum`, `optimism`, `metis`, `starkware` |             |

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
