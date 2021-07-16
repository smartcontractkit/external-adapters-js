# Chainlink External Adapter for Dxdao

### Environment Variables

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `RPC_URL`  |   The RPC URL to connect to the XDai chain    |  |             |

This adapter also relies on the Token Allocation adapter to fetch the USD price of ETH.  This requires setting up the environment variables 
for the token allocation adapter as well.  The instructions for that can be found here https://github.com/smartcontractkit/external-adapters-js/tree/develop/packages/composites/token-allocation.


---

### Input Parameters

No input parameters required

---

## Dxdao Endpoint

This endpoint fetches the TVL(Total Value Locked) inside a pair that is deployed on the XDai chain.  The TVL is returned in USD.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `wethContractAddress`  |   The WETH contract address on the XDai Chain    |  |             |
|    ✅     | `pairContractAddress` | The pair contract's address on the XDai Chain |   |             |
|         | `tokenAllocationSource` | Which source to fetch the Ethereum USD price from |   |             |

### Sample Input

```json
{
    "id": 1,
    "data": {
        "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
        "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
        "tokenAllocationSource": "tiingo"
    }
}
```

### Sample Output

```json
{
    "jobRunID": 1,
    "result": 849774.7320901232,
    "statusCode": 200,
    "data": {
        "result": 849774.7320901232
    }
}
```
