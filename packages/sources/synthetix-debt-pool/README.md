# Chainlink External Adapter for Synthetix-debt-pool

The Synthetix debt pool adapter fetches the total debt from the DebtCache contract.

### Environment Variables

| Required? |           Name            |               Description               | Options | Defaults to |
| :-------: | :-----------------------: | :-------------------------------------: | :-----: | :---------: |
|           |          RPC_URL          |        A valid Ethereum RPC URL         |         |             |
|           |       KOVAN_RPC_URL       |          A valid Kovan RPC URL          |         |             |
|           |     OPTIMISM_RPC_URL      |        A valid Optimism RPC URL         |         |             |
|           |      GOERLI_RPC_URL       |         A valid Goerli RPC URL          |         |             |
|           |  GOERLI_OPTIMISM_RPC_URL  |     A valid Goerli Optimism RPC URL     |         |             |
|           |  KOVAN_OPTIMISM_RPC_URL   |     A valid Kovan Optimism RPC URL      |         |             |
|           | SEPOLIA_OPTIMISM_RPC_URL  |    A valid Sepolia Optimism RPC URL     |         |             |
|           |         CHAIN_ID          |     Ethereum chain id to connect to     |         |      1      |
|           |      KOVAN_CHAIN_ID       |      Kovan chain id to connect to       |         |     42      |
|           |     OPTIMISM_CHAIN_ID     |     Optimism chain id to connect to     |         |     10      |
|           |  KOVAN_OPTIMISM_CHAIN_ID  |  Kovan Optimism chain id to connect to  |         |     69      |
|           |      GOERLI_CHAIN_ID      |  Kovan Optimism chain id to connect to  |         |      5      |
|           | GOERLI_OPTIMISM_CHAIN_ID  |  Kovan Optimism chain id to connect to  |         |     420     |
|           | SEPOLIA_OPTIMISM_CHAIN_ID | Sepolia Optimism chain id to connect to |         |  11155420   |

The environment variables above are not required to start the adapter but are required when you want to pull the debt from that chain. Not setting any will not prevent the adapter from starting but it won't be able to pull debt from any chains.

---

### Input Parameters

| Required? |   Name   |     Description     |                            Options                             | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [`debt`](#Debt-Endpoint), [`debt-ratio`](#Debt-Ratio-Endpoint) |   `debt`    |

---

## Debt-Endpoint

### Input Params

| Required? |     Name     |       Description        |                                                                                                            Options                                                                                                             | Defaults to |
| :-------: | :----------: | :----------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | chainSources | Chains to pull debt from | Array of chains to pull debt from. Options for array elements are `mainnet`, `mainnet-ovm`, `kovan`, `kovan-ovm`, `goerli`, `goerli-ovm` and `sepolia-ovm`. Leaving this blank will pull data from `mainnet` and `mainnet-ovm` |             |

### Sample Input

```json
{
  "id": 1,
  "data": {
    "chainSources": ["mainnet"]
  }
}
```

### Sample Output

```json
{
  "jobRunID": 1,
  "result": "173124247725705425179753282",
  "statusCode": 200,
  "data": {
    "result": "173124247725705425179753282"
  }
}
```

## Debt-Ratio-Endpoint

### Input Params

| Required? |     Name     |       Description        |                                                                                                            Options                                                                                                             | Defaults to |
| :-------: | :----------: | :----------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | chainSources | Chains to pull debt from | Array of chains to pull debt from. Options for array elements are `mainnet`, `mainnet-ovm`, `kovan`, `kovan-ovm`, `goerli`, `goerli-ovm` and `sepolia-ovm`. Leaving this blank will pull data from `mainnet` and `mainnet-ovm` |             |

### Sample Input

```json
{
  "id": 1,
  "data": {
    "chainSources": ["mainnet"],
    "endpoint": "debt-ratio"
  }
}
```

### Sample Output

```json
{
  "jobRunID": 1,
  "result": "1075142753974996121253281029",
  "statusCode": 200,
  "data": {
    "result": "1075142753974996121253281029"
  }
}
```
