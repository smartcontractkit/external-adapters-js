# Chainlink External Adapter for Dxdao

### Environment Variables

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `RPC_URL`  |   The RPC URL to connect to the XDai chain    |  |             |
|         | `WETH_CONTRACT_ADDRESS`  |   The WETH contract address on the XDai Chain    |  |     0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1        |      

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
|    ✅     | `pairContractAddress` | The pair contract's address on the XDai Chain |   |             |

This adapter also accepts the all parameters that is accepted by the token allocation adapter apart from the allocations array. https://github.com/smartcontractkit/external-adapters-js/tree/develop/packages/composites/token-allocation

### Sample Input for Fetching TVL In USD

```json
{
    "id": 1,
    "data": {
        "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
        "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
        "source": "tiingo"
    }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 869366.9652747929,
    "statusCode": 200,
    "data": {
        "sources": [],
        "payload": {
            "WETH": {
                "quote": {
                    "USD": {
                        "price": 1825.6454379957377
                    }
                }
            }
        },
        "result": 869366.9652747929
    }
}
```