# Chainlink External Adapters to query wBTC custodial address set

## Configuration

The adapter takes the following environment variables:

| Required? |         Name         |                  Description                   | Options | Defaults to |
| :-------: | :------------------: | :--------------------------------------------: | :-----: | :---------: |
|           |  `MEMBERS_ENDPOINT`  | wBTC endpoint of members (and their addresses) |         |             |
|           | `ADDRESSES_ENDPOINT` |           wBTC endpoint of addresses           |         |             |

## Running

### Input Params

| Required? |    Name    |                                                         Description                                                          |      Options       | Defaults to |
| :-------: | :--------: | :--------------------------------------------------------------------------------------------------------------------------: | :----------------: | :---------: |
|           | `endpoint` | Which endpoint to use. Requires that the selected endpoint has been set as an env var (see [configuration](#configuration)). | members, addresses |  addresses  |

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "address": "31h6SJ58NqVrifuyXN5A19ByD6vgyKVHEY",
        "balance": "0",
        "chainId": "mainnet",
        "coin": "btc",
        "id": "601c5e4b11b1d4001e37091aa2618ee9",
        "network": "bitcoin",
        "type": "custodial",
        "verified": false
      }
    ]
  },
  "result": [
    {
      "address": "31h6SJ58NqVrifuyXN5A19ByD6vgyKVHEY",
      "balance": "0",
      "chainId": "mainnet",
      "coin": "btc",
      "id": "601c5e4b11b1d4001e37091aa2618ee9",
      "network": "bitcoin",
      "type": "custodial",
      "verified": false
    }
  ],
  "statusCode": 200
}
```
