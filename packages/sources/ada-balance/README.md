# Chainlink External Adapter for Ada-balance

This adapter can be used to query Cardano address balances. The balance is queried from a Cardano node that has Ogmios running on top of it. Ogmios is a
lightweight bridge interface that allows clients to query the Cardano node using JSON-RPC. More details can be found on their website https://ogmios.dev/.

### Environment Variables

| Required? |      Name       |                  Description                   | Options | Defaults to |
| :-------: | :-------------: | :--------------------------------------------: | :-----: | :---------: |
|    ✅     | WS_API_ENDPOINT |    The WS API endpoint of the Cardano node     |         |             |
|           |    RPC_PORT     | The port the Cardano Ogmios node is running on |         |    1337     |

---

## Ada-balance Endpoint

This endpoint fetches an address's balance and outputs it in Lovelace.

### Input Params

| Required? |    Name     |                 Description                 | Options | Defaults to |
| :-------: | :---------: | :-----------------------------------------: | :-----: | :---------: | --- |
|    ✅     | `addresses` | An array of addresses to query balances for |         |             |     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "addresses": [
      "addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m"
    ]
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 5000000,
  "statusCode": 200,
  "data": {
    "result": 5000000
  }
}
```
