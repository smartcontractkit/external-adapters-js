# Chainlink External Adapter for Dxdao

### Environment Variables

No adapter specific environment variables

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
|         | `xdaiEthUsdPriceFeedAddress` | The ETH-USD price feed address on the XDai Chain |   |             |

### Sample Input

```json
{
    "id": 1,
    "data": {
        "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
        "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
        "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
    }
}
```

### Sample Output

```json
{
    "jobRunID": 1,
    "result": "91218",
    "statusCode": 200,
    "data": {
        "result": "91218"
    }
}
```
