# Chainlink External Adapter for Layer 2 Sequencer Health Check

Adapter that checks the Layer 2 Sequencer status

### Environment Variables

| Required? |            Name            |                                   Description                                   | Options |                 Defaults to                  |
| :-------: | :------------------------: | :-----------------------------------------------------------------------------: | :-----: | :------------------------------------------: |
|           |          `DELTA`           | Maximum time in milliseconds from last seen block to consider sequencer healthy |         |                120000 (2 min)                |
|           |       `DELTA_BLOCKS`       |           Maximum allowed number of blocks that Nodes can fall behind           |         |                      6                       |
|           |  `NETWORK_TIMEOUT_LIMIT`   |         Maximum time in milliseconds to wait for a transaction receipt          |         |                5000 (5 secs)                 |
|           |  `ARBITRUM_RPC_ENDPOINT`   |                              Arbitrum RPC Endpoint                              |         |         https://arb1.arbitrum.io/rpc         |
|           | `ARBITRUM_HEALTH_ENDPOINT` |                            Arbitrum Health Endpoint                             |         |                                              |
|           |  `OPTIMISM_RPC_ENDPOINT`   |                              Optimism RPC Endpoint                              |         |         https://mainnet.optimism.io          |
|           | `OPTIMISM_HEALTH_ENDPOINT` |                            Optimism Health Endpoint                             |         | https://mainnet-sequencer.optimism.io/health |

For the adapter to be useful on the desired network, at least one endpoint (RPC or HEALTH) needs to provided

---

### Input Parameters

| Required? |  Name   |       Description        |       Options        | Defaults to |
| :-------: | :-----: | :----------------------: | :------------------: | :---------: |
|    ✅     | network | Layer 2 Network to check | arbitrum or optimism |             |

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

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": true,
    "isHealthy": true
  },
  "statusCode": 200
}
```
