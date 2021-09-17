# Chainlink External Adapter for Blocknative

[Blocknative](https://www.blocknative.com/)

[Blocknative API docs](https://docs.blocknative.com/)

### Environment Variables

| Required? |   Name    |                            Description                             |
| :-------: | :-------: | :----------------------------------------------------------------: |
|    ✅     | `API_KEY` | An API key that can be obtained from the data provider's dashboard |

---

### Input Parameters

| Required? |    Name    |     Description     |                      Options                      |  Defaults to  |
| :-------: | :--------: | :-----------------: | :-----------------------------------------------: | :-----------: |
|           | `endpoint` | The endpoint to use | [blockprices](#get-gas-price-estimation-endpoint) | `blockprices` |

---

## Get Gas Price Estimation Endpoint

Returns the gas price (wei) needed to qualify a transaction for inclusion in the next block for a given confidence level.

### Input Params

| Required? |       Name        |                                     Description                                     |        Options        | Defaults to |
| :-------: | :---------------: | :---------------------------------------------------------------------------------: | :-------------------: | :---------: |
|    ✅     |      `type`       |                The fee market mechanism (details in the table below)                |  `legacy`, `eip1559`  |             |
|    ✅     | `confidenceLevel` | The probability that if a transaction is sent it will be included in the next block | `1` to `99` (integer) |             |

Fee fields by `type` :

|   type    |                   Fees                    | Units |
| :-------: | :---------------------------------------: | :---: |
| `legacy`  |                `gasPrice`                 |  wei  |
| `eip1559` | `maxPriorityFeePerGas` and `maxFeePerGas` |  wei  |

### Type Legacy Sample Input

```json
{
  "id": "1",
  "data": {
    "type": "legacy",
    "confidenceLevel": 95
  }
}
```

### Type Legacy Sample Output

Result to be consumed as `bytes32`.

```json
{
  "jobRunID": "1",
  "result": "70000000000",
  "data": {
    "result": "70000000000"
  },
  "statusCode": 200
}
```

**Gas Price** = 70 gwei

### Type EIP-1559 Sample Input

```json
{
  "id": "1",
  "data": {
    "type": "eip1559",
    "confidenceLevel": 95
  }
}
```

### Type EIP-1559 Sample Output

Result to be consumed as `bytes32` (from `"[<maxPriorityFeePerGas>,<maxFeePerGas>]"`).

```json
{
  "jobRunID": "1",
  "result": "[1910000000,138170000000]",
  "data": {
    "result": "[1910000000,138170000000]"
  },
  "statusCode": 200
}
```

**Max Priority Fee Per Gas** = 1.91 gwei

**Max Fee Per Gas** = is 138.17 gwei
