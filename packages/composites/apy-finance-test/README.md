# Chainlink Apy-finance-test Composite Adapter

This adapter calculates APY Finance TVL (Total Value Locked).

## Configuration

The adapter takes the following environment variables:

| Required? |              Name              |                        Description                        | Options |                 Defaults to                  |
| :-------: | :----------------------------: | :-------------------------------------------------------: | :-----: | :------------------------------------------: |
|    ✅     |           `RPC_URL`            |          The RPC URL to connect to the EVM chain          |         |                                              |
|    ✅     |           `CHAIN_ID`           |                The chain id to connect to                 |         |                      1                       |
|    ✅     |       `REGISTRY_ADDRESS`       | The address of the deployed APY.Finance Registry contract |         |                                              |
|    ✅     |      `MULTICALL_ADDRESS`       |          The address of the Multicall3 contract           |         | `0xcA11bde05977b3631167028862bE2a173976CA11` |
|    ✅     | `TOKEN_ALLOCATION_ADAPTER_URL` |      The URL of a Token Allocation external adapter       |         |                                              |

**Additional defaults will be set on the Token Allocation adapter**

This composite adapter calls the Token Allocation adapter, which is run separately. As such, configuration for the Token Allocation adapter will apply to this adapter. See the [Token Allocation README](../../non-deployable/token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## TVL endpoint

### Input Params

| Required? |            Name            |               Description                | Options |            Defaults to            |
| :-------: | :------------------------: | :--------------------------------------: | :-----: | :-------------------------------: |
|           |          `source`          |   The data provider to query data from   |         | Token Allocation adapter defaults |
|           | `quote`, `to`, or `market` | The symbol of the currency to convert to |         | Token Allocation adapter defaults |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "source": "tiingo",
    "quote": "USD",
    "endpoint": "tvl"
  }
}
```

### Sample Output

```json
{
  "data": {
    "sources": [],
    "payload": {
      "DAI": {
        "quote": {
          "USD": {
            "price": 1.000068324337687
          }
        }
      },
      "USDC": {
        "quote": {
          "USD": {
            "price": 1.0002022721488166
          }
        }
      },
      "USDT": {
        "quote": {
          "USD": {
            "price": 1.000222811595245
          }
        }
      }
    },
    "result": 902487.3652257232
  },
  "result": 902487.3652257232,
  "timestamps": {
    "providerDataRequestedUnixMs": 1687278960418,
    "providerDataReceivedUnixMs": 1687278960436
  },
  "statusCode": 200,
  "meta": {
    "adapterName": "APY_FINANCE",
    "metrics": {
      "feedId": "{\"source\":\"tiingo\",\"quote\":\"usd\"}"
    }
  }
}
```

## Allocations endpoint

### Input Params

None

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "allocations"
  }
}
```

### Sample Output

```json
{
  "data": [
    {
      "symbol": "DAI",
      "balance": "0",
      "decimals": 18
    },
    {
      "symbol": "USDC",
      "balance": "902304854084",
      "decimals": 6
    },
    {
      "symbol": "USDT",
      "balance": "0",
      "decimals": 6
    }
  ],
  "result": null,
  "timestamps": {
    "providerDataRequestedUnixMs": 1687278825996,
    "providerDataReceivedUnixMs": 1687278851062
  },
  "statusCode": 200,
  "meta": {
    "adapterName": "APY_FINANCE",
    "metrics": {
      "feedId": "N/A"
    }
  }
}
```
