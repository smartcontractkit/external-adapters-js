# Chainlink External Adapter for View-Function

External adapter for executing contract function and returning the result

### Environment Variables

The adapter takes the following environment variables:

| Required? |  Name   |     Description     | Options | Defaults to |
| :-------: | :-----: | :-----------------: | :-----: | :---------: |
|    ✅     | RPC_URL | RPC URL of ETH node |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [function](#Function-Endpoint) |  function   |

---

## Function Endpoint

### Input Params

| Required? |           Name            |                                                                         Description                                                                         | Options | Defaults to |
| :-------: | :-----------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  `address` or `contract`  |                                                                   Address of the contract                                                                   |         |             |
|    ✅     | `function` or `signature` | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |         |             |
|           |       `inputParams`       |                                                            Array of function parameters in order                                                            |         |             |

### Sample Input

```json
{
  "id": 1,
  "data": {
    "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "function": "function symbol() view returns (string)"
  }
}
```

### Sample Output

```json
{
  "jobRunID": 1,
  "result": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553445400000000000000000000000000000000000000000000000000000000",
  "statusCode": 200,
  "data": {
    "result": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553445400000000000000000000000000000000000000000000000000000000"
  }
}
```

### Sample Input with parameters

```json
{
  "id": 1,
  "data": {
    "contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "function": "function balanceOf(address) view returns (uint)",
    "inputParams": ["0x3BA0d70d2C522477607c1cfa14f66482bA920f9D"]
  }
}
```

### Output

```json
{
  "jobRunID": 1,
  "result": "0x000000000000000000000000000000000000000000000000000000002cf42545",
  "statusCode": 200,
  "data": {
    "result": "0x000000000000000000000000000000000000000000000000000000002cf42545"
  }
}
```
