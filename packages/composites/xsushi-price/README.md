# Chainlink xSUSHI Price Composite Adapter

Due to additional complexities with the xSUSHI token, this adapter allows for getting the real price of xSUSHI.

The calculation is done as follows:

```
pricexSUSHI = priceSUSHI * (SUSHI.balanceOf(xSUSHI.address) * 1e18 / xSUSHI.totalSupply())
```

## Configuration

The adapter takes the following environment variables:

| Required? |        Name         |           Description           | Options |                 Defaults to                  |
| :-------: | :-----------------: | :-----------------------------: | :-----: | :------------------------------------------: |
|    ✅     | `ETHEREUM_RPC_URL`  |    URL of Ethereum RPC node     |         |                                              |
|           | `ETHEREUM_CHAIN_ID` |   The chain id to connect to    |         |                      1                       |
|           |  `XSUSHI_ADDRESS`   | The address of the xSUSHI token |         | `0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272` |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../../non-deployable/token-allocation/README.md](../../non-deployable/token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

---

### Input Parameters

| Required? |   Name   |     Description     |                                   Options                                    | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [ratio](#Ratio-Endpoint), [sushi](#Sushi-Endpoint) |    price    |

---

## Price Endpoint

### Input Params

| Required? |            Name            |                               Description                                |       Options       | Defaults to |
| :-------: | :------------------------: | :----------------------------------------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                   The symbol of the currency to query                    |      `xSUSHI`       |             |
|    ✅     | `quote`, `to`, or `market` |                 The symbol of the currency to convert to                 | `BTC`, `ETH`, `USD` |             |
|           |          `source`          | The data provider to query. This is required if not specified in config. |                     |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "xSUSHI",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "data": {
    "payload": {
      "SUSHI": {
        "quote": {
          "USD": {
            "price": 12.049759759496
          }
        }
      }
    },
    "result": 14.422000451599907,
    "sources": []
  },
  "jobRunID": "1",
  "result": 14.422000451599907,
  "statusCode": 200
}
```

---

## Ratio Endpoint

Gets the ratio between SUSHI and xSUSHI tokens (with 18 decimals)

### Input Params

_None_

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "data": "1196870372476465755",
  "jobRunID": "1",
  "statusCode": 200
}
```

---

## Sushi Endpoint

Gets the SUSHI token address from the xSUSHI contract

### Input Params

_None_

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "data": "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
  "jobRunID": "1",
  "statusCode": 200
}
```
