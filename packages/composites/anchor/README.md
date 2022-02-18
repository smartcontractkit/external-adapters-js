# Chainlink Anchor Composite Adapter

This composite adapter fetches the price of a given token from the Anchor protocol.

## Configuration

The adapter takes the following environment variables:

| Required? |              Name               |               Description                |                                             Options                                             |                  Defaults to                   |
| :-------: | :-----------------------------: | :--------------------------------------: | :---------------------------------------------------------------------------------------------: | :--------------------------------------------: |
|    ✅     |            `RPC_URL`            |   The RPC URL to connect to the chain    |                                                                                                 |                                                |
|           | `ANCHOR_VAULT_CONTRACT_ADDRESS` | The address of the Anchor Vault contract | Address can be found [here](https://docs.anchorprotocol.com/smart-contracts/deployed-contracts) |  `0xA2F987A546D4CD1c607Ee8141276876C26b72Bdf`  |
|           | `TERRA_BLUNA_CONTRACT_ADDRESS`  |  The address of bLuna contract in Terra  | Address can be found [here](https://docs.anchorprotocol.com/smart-contracts/deployed-contracts) | `terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts` |
|           |  `STETH_POOL_CONTRACT_ADDRESS`  |      The address of stEth contract       |                   Address can be found by finding the stETH/ETH pool in Curve                   |  `0xdc24316b9ae028f1497c275eb9192a3ea0f67022`  |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

**Additional environment variables must be set according to the Terra View Function adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../../sources/terra-view-function/README.md](../sources/terra-view-function/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Price Endpoint

### Input Params

| Required? |            Name            |                                 Description                                 |       Options       | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                     The symbol of the currency to query                     |   `BEth`, `BLuna`   |             |
|    ✅     | `quote`, `to`, or `market` |                  The symbol of the currency to convert to                   | `BTC`, `ETH`, `USD` |             |
|           |      `quoteDecimals`       | The number of decimals of the `to` coin. Can be left blank if `to` is `USD` |                     |     18      |
|           |          `source`          |  The data provider to query. This is required if not specified in config.   |                     |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "BETH",
    "to": "USD"
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

#### BLuna Additional params

N/A

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "BLuna",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 68.68049351018732,
  "statusCode": 200,
  "data": {
    "result": 68.68049351018732
  }
}
```
