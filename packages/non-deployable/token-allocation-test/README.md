# Chainlink Token Allocation Test Utility Adapter

This utility adapter exposes a function `getTotalAllocations` for making asynchronous requests to a financial data source
and calculating the total value in the selected currency based on the response payload.

## Running

`getTotalAllocations` accepts one parameter of type `TotalAllocationParams`. `TotalAllocationParams` is an object with following properties

1. `allocations`- Starting array of allocation objects

Parameters for each allocation in the `allocations` array

| Required |    Name    |  Description   | Default |
| :------: | :--------: | :------------: | :-----: |
|    ✅    |  `symbol`  |  Token symbol  |         |
|          | `balance`  | Token balance  | `1e18`  |
|          | `decimals` | Token decimals |  `18`   |

2. `sourceUrl` - URL of running source EA instance.
3. `method` (optional) - The name of the endpoint for the source EA (`price` or `marketcap`).
4. `quote` (optional) - Currency we want the price on (default is `USD`).
5. `additionalInput`(optional) - Additional key-value data to send to the source EA.

### Example

```typescript
const allocations = [
  {
    symbol: 'DAI',
    balance: '0',
    decimals: 18,
  },
  {
    symbol: 'USDC',
    balance: '910158472067',
    decimals: 6,
  },
]
const sourceUrl = process.env.COINGECKO_ADAPTER_URL

const response = await getTotalAllocations({
  allocations,
  sourceUrl,
})

//response
/*
{
  "payload": {
  "DAI": {
    "quote": {
      "USD": {
        "price": 0.9997940587259735,
      },
    },
  },
  "USDC": {
    "quote": {
      "USD": {
        "price": 1.0000065541408647,
      },
    },
  },
},
  "result": 910164.4373738351,
  "sources": [],
}
*/
```
