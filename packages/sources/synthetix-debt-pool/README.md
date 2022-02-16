# Chainlink External Adapter for Synthetix-debt-pool

The Synthetix debt pool adapter fetches the total debt from the DebtCache contract.

### Environment Variables

| Required? |          Name          |          Description           | Options | Defaults to |
| :-------: | :--------------------: | :----------------------------: | :-----: | :---------: |
|           |        RPC_URL         |    A valid Ethereum RPC URL    |         |             |
|           |     KOVAN_RPC_URL      |     A valid Kovan RPC URL      |         |             |
|           |    OPTIMISM_RPC_URL    |    A valid Optimism RPC URL    |         |             |
|           | KOVAN_OPTIMISM_RPC_URL | A valid Kovan Optimism RPC URL |         |             |

The environment variables above are not required to start the adapter but are required when you want to pull the debt from that chain. Not setting any will not prevent the adapter from starting but it won't be able to pull debt from any chains.

---

### Input Parameters

N/A

---

## Synthetix-debt-pool Endpoint

### Input Params

| Required? |     Name     |       Description        |                                                                                       Options                                                                                        | Defaults to |
| :-------: | :----------: | :----------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | chainSources | Chains to pull debt from | Array of chains to pull debt from. Options for array elements are `mainnet`, `mainnet-ovm`, `kovan`, `kovan-ovm`. Leaving this blank will pull data from `mainnet` and `mainnet-ovm` |             |

### Sample Input 1

```json
{
  "id": 1,
  "data": {}
}
```

### Sample Output 2

```json
{
  "jobRunID": 1,
  "result": "325477250609593129853813523",
  "maxAge": 30000,
  "statusCode": 200,
  "data": {
    "result": "325477250609593129853813523",
    "isInvalid": false
  }
}
```

### Sample Input 2

```json
{
  "id": 1,
  "data": {
    "chainSources": ["ethereum"]
  }
}
```

### Sample Output 2

```json
{
  "jobRunID": 1,
  "result": "0x000000000063e236fd9b18e9473beb3700000000006437f697997ef9b6da0555",
  "statusCode": 200,
  "data": {
    "result": "0x000000000063e236fd9b18e9473beb3700000000006437f697997ef9b6da0555"
  }
}
```
