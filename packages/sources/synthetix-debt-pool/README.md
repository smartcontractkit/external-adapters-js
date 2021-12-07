# Chainlink External Adapter for Synthetix-debt-pool

The Synthetix debt pool adapter fetches the total debt from the DebtCache contract.

### Environment Variables

| Required? |                    Name                    |                       Description                        | Options | Defaults to |
| :-------: | :----------------------------------------: | :------------------------------------------------------: | :-----: | :---------: |
|           | ETHEREUM_ADDRESS_PROVIDER_CONTRACT_ADDRESS | The address of the address provider contract in ethereum |         |             |
|           |              ETHEREUM_RPC_URL              |             A valid Ethereum Mainnet RPC URL             |         |             |
|           | OPTIMISM_ADDRESS_PROVIDER_CONTRACT_ADDRESS | The address of the address provider contract in ethereum |         |             |
|           |              OPTIMISM_RPC_URL              |             A valid Ethereum Mainnet RPC URL             |         |             |

The environment variables above are not required to start the adapter but are required when you want to pull the debt from that chain. Not setting any will not prevent the adapter from starting but it won't be able to pull debt from any chains.

---

### Input Parameters

N/A

---

## Synthetix-debt-pool Endpoint

### Input Params

| Required? |     Name     |       Description        |        Options         | Defaults to |
| :-------: | :----------: | :----------------------: | :--------------------: | :---------: |
|           | chainSources | Chains to pull debt from | `ethereum`, `optimism` |             |

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
    "chainSources": ["optimism"]
  }
}
```

### Sample Output 2

```json
{
  "jobRunID": 1,
  "result": "50977793699622560436740360",
  "statusCode": 200,
  "data": {
    "result": "50977793699622560436740360",
    "isInvalid": false
  }
}
```
