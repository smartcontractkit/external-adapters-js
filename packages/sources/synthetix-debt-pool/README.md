# Chainlink External Adapter for Synthetix-debt-pool

The Synthetix debt pool adapter fetches the total debt from the DebtCache contract.

### Environment Variables

| Required? |          Name           |                 Description                  | Options |                Defaults to                 |
| :-------: | :---------------------: | :------------------------------------------: | :-----: | :----------------------------------------: |
|           | DEBT_POOL_CACHE_ADDRESS |    The address of the DebtCache contract     |         | 0x9bB05EF2cA7DBAafFC3da1939D1492e6b00F39b8 |
|    ✅     |         RPC_URL         | A valid RPC URL to connect to the blockchain |         |                                            |

---

### Input Parameters

N/A

---

## Synthetix-debt-pool Endpoint

### Input Params

N/A

### Sample Input

```json
{
  "id": 1,
  "data": {}
}
```

### Sample Output

```json
{
  "jobRunID": 1,
  "result": "464774989776339326173983425",
  "statusCode": 200,
  "data": {
    "result": "464774989776339326173983425",
    "total": "464774989776339326173983425",
    "isInvalid": false
  }
}
```
