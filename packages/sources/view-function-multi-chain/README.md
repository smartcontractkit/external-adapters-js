# VIEW_FUNCTION_MULTI_CHAIN

![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |  {NETWORK}\_RPC_URL   |           RPC url for a NETWORK. NETWORK is the value of `network` input param            | string |         |         |
|    ✅     |  {NETWORK}\_CHAIN_ID  |           Chain id for a NETWORK. NETWORK is the value of `network` input param           | number |         |         |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [function](#function-endpoint) | `function` |

## Function Endpoint

`function` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                                                                         Description                                                                         |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |         |         |            |                |
|    ✅     |   address   | `contract` |                                                                   Address of the contract                                                                   |  string  |         |         |            |                |
|           | inputParams |            |                                                            Array of function parameters in order                                                            | string[] |         |         |            |                |
|    ✅     |   network   |            |                                                                      RPC network name                                                                       |  string  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "function",
    "signature": "function latestAnswer() view returns (int256)",
    "address": "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    "network": "ETHEREUM_GOERLI"
  }
}
```

---

MIT License
