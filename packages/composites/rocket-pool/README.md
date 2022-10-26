# Chainlink Rocket Pool Composite Adapter

## Configuration

The adapter takes the following environment variables:

|        Name         | Required? |                                                     Description                                                      | Options | Defaults to |
| :-----------------: | :-------: | :------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
| `ETHEREUM_RPC_URL`  |    ✅     |                             RPC URL to Ethereum mainnet. Used for rETH staking contract.                             |         |             |
| `<network>_RPC_URL` |    ✅     | RPC URL to network(s) desired. Used to fetch latest value of ETH/USD from Chainlink price feed on the given network. |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

|         Name         | Required? |                                  Description                                   |   Options    |                 Defaults to                  |
| :------------------: | :-------: | :----------------------------------------------------------------------------: | :----------: | :------------------------------------------: |
|       `quote`        |           |                        Quote currency to pull price for                        | `ETH`, `USD` |                    `ETH`                     |
|      `network`       |           | Network to query for price feed (EA must have `<network>_RPC_URL` configured). |              |                  `ethereum`                  |
| `ethUsdProxyAddress` |           |            Address for the ETH/USD price feed on the given network.            |              | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1342.2278052102286,
  "providerStatusCode": 200,
  "statusCode": 200,
  "data": {
    "result": 1342.2278052102286
  }
}
```
