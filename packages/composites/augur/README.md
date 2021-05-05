# Chainlink Augur Composite Adapter

Composite adapter to handle Augur market creation and resolution

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `RPC_URL` | RPC URL for the ETH node |         |             |
|    ✅     | `PRIVATE_KEY` | Private key of the account to use for on-chain txs |         |             |

Any configuration params for The Rundown are also required.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `method`  |   The method to call    | `resolve`, `create` |             |
|    ✅     | `sportId`  |   The sportId to call for    |  |             |
|    ✅     | `contractAddress`  |   The contract address to interact with    |  |             |
|    ✅     | `daysInAdvance`  | Create only: number of days in advance to create events for |  |             |
|    ✅     | `startBuffer`  | Create only: number of seconds in the future the event has to be to create |  |             |
|    ✅     | `affiliateIds`  | Create only: prioritized array of affiliate ids to use |  |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "method": "resolve",
    "sportId": 2,
    "daysInAdvance": 7,
    "startBuffer": 60,
    "affiliateIds": [9, 3],
    "contractAddress": "0xB0bA59d42Fb0f9305F06FC0e2C4e2fe64A5bd39F"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {},
  "statusCode": 200
}
```
