# Chainlink The-graph Composite Adapter

The Graph adapter is a generic adapter to query information from The Graph.  It currently only supports fetching prices from the Uniswap subgraph.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `RPC_URL` | The-graph _required_ parameter |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|           |       `method`             |   What data type to query for            |        price             |     price        |
|    ✅     |       `baseCoinTicker`, `base`, `from`, `coin`     |   The symbol of the base currency       |                     |             |
|    ✅      |       `quoteCoinTicker`, `quote`, `to`, `market`     |   The symbol of the quote currency      |                     |             |
|           |       `theGraphQuote`     |   The symbol of the quote currency.  This will override `quoteCoinTicker` if supplied      |                     |             |
|         |       `intermedaryToken`      |   An intermediary token to use if the base and quote coin pair does not exist in the DEX.       |                     |      WETH       |
|           |       `dex`                |   The DEX to query data from             |   UNISWAP           |   UNISWAP   |    
|           | `referenceContract`         |   The smart contract address of a price feed.  This is used if the price from fetched from the DEX needs to be modified    | |             |
|           | `referenceContractDivisor`  |   How much the value from the referenceContract needs to be multiplied or divided by    |      |             |
|           | `referenceModifierAction`  |   Whether to multiply or divide the DEX result by the result from the `referenceContract`   |  multiply, divide  |      multiply       |

### Sample Input 

```json
{
    "jobRunId": 1,
    "data": {
        "baseCoinTicker": "UNI",
        "quoteCoinTicker": "LINK"
    }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": "0.9794765982638552441956712315789272",
    "statusCode": 200,
    "data": {
        "result": "0.9794765982638552441956712315789272"
    }
}
```


### Sample Input to fetch the price of USD/UNI

This request will first fetch the price of USDT/UNI from the Uniswap subgraph, fetch the price of USDT/USD using the price feed at the `referenceContract` and then 
combine the two to get the price of USD/UNI.


```json
{
    "jobRunId": 1,
    "data": {
        "baseCoinTicker": "UNI",
        "quoteCoinTicker": "USDT",
        "referenceContract": "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
        "referenceContractDivisor": "100000000",
        "referenceModifierAction": "divide"
    }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 18.889804922939742,
    "statusCode": 200,
    "data": {
        "result": 18.889804922939742
    }
}
```

### Sample Input to fetch the price of LINK/SUSHI

There currently isn't a pool for LINK/SUSHI in Uniswap so the price needs to be determined through an intermediary token that has a pair with both the base and
quote tokens.  In this example, the adapter will first fetch the price of SUSHI/WETH and LINK/WETH and then combine the two to get the final result.

```json
{
    "jobRunId": 1,
    "data": {
        "baseCoinTicker": "SUSHI",
        "quoteCoinTicker": "LINK",
        "intermediaryToken": "WETH" // Defaults to WETH
    }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 0.4050148172415684,
    "statusCode": 200,
    "data": {
        "result": 0.4050148172415684
    }
}
```