# Chainlink Price Composite Adapter

This composite adapter fetches the price of a given token if it needs to be derived through an intermediary token.

## Configuration

The adapter takes the following environment variables:

| Required? |              Name               |               Description                |                                             Options                                             | Defaults to |
| :-------: | :-----------------------------: | :--------------------------------------: | :---------------------------------------------------------------------------------------------: | :---------: |
|    ✅     |            `RPC_URL`            |   The RPC URL to connect to the chain    |                                                                                                 |             |
|    ✅     | `ANCHOR_VAULT_CONTRACT_ADDRESS` | The address of the anchor vault contract | Address can be found [here](https://docs.anchorprotocol.com/smart-contracts/deployed-contracts) |             |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Price Endpoint

### Input Params

| Required? |            Name            |                                 Description                                 |       Options       | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                     The symbol of the currency to query                     |       `BEth`        |             |
|    ✅     | `quote`, `to`, or `market` |                  The symbol of the currency to convert to                   | `BTC`, `ETH`, `USD` |             |
|           |      `quoteDecimals`       | The number of decimals of the `to` coin. Can be left blank if `to` is `USD` |                     |     18      |
|           |          `source`          |  The data provider to query. This is required if not specified in config.   |                     |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "BETH",
    "to": "USD",
    "source": "coingecko"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 4507.32,
  "statusCode": 200,
  "data": {
    "result": 4507.32
  }
}
```
