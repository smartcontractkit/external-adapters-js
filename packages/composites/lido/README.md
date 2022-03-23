# Chainlink External Adapter for wstETH Price

This external adapter will fetch the exchange rate for the amount of stETH per 1 wstETH from the WstETH contract on the Ethereum mainnet.

## Configuration

The adapter takes the following environment variables:

| Required? |        Name        |               Description                | Options |                 Defaults to                  |
| :-------: | :----------------: | :--------------------------------------: | :-----: | :------------------------------------------: |
|    ✅     | `ETHEREUM_RPC_URL` |      RPC URL of a Mainnet ETH node       |         |                                              |
|           |     `RPC_URL`      | A fallback RPC URL of a Mainnet ETH node |         |                                              |
|           |  `WSTETH_ADDRESS`  |     The address of the `sAVAX` token     |         | `0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0` |

## Running

`yarn start`

### Input Params

N/A

### Sample Input

```json
{}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "providerStatusCode": 200,
  "result": 1065508199231399700,
  "statusCode": 200,
  "data": {
    "result": 1065508199231399700
  }
}
```
