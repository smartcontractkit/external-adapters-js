# Chainlink External Adapter for Dxdao

### Environment Variables

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `RPC_URL`  |   The RPC URL to connect to the XDai chain    |  |             |
|         | `WETH_CONTRACT_ADDRESS`  |   The WETH contract address on the XDai Chain    |  |     0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1        |      

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

---

### Input Parameters

**Additional environment input params must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

---

## Dxdao Endpoint

This endpoint fetches the TVL(Total Value Locked) inside a pair that is deployed on the XDai chain.  The TVL is returned in USD.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `pairContractAddress` | The pair contract's address on the XDai Chain |   |             |


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