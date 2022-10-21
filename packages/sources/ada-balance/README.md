# Chainlink External Adapter for Ada-balance

This adapter can be used to query Cardano address balances. The balance is queried from a Cardano node that has Ogmios running on top of it. Ogmios is a
lightweight bridge interface that allows clients to query the Cardano node using JSON-RPC. More details can be found on their website https://ogmios.dev/.

### Environment Variables

The first two environment variable will take precedence over the others.

| Required? |      Name       |                                            Description                                             | Options | Defaults to |
| :-------: | :-------------: | :------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | HTTP_OGMIOS_URL |         The HTTP API endpoint of the Cardano node. Required if `WS_API_ENDPOINT` not set.          |         |             |
|           |  WS_OGMIOS_URL  |          The WS API endpoint of the Cardano node. Required if `WS_API_ENDPOINT` not set.           |         |             |
|           | WS_API_ENDPOINT | The WS host url of the Cardano node. Required if `HTTP_OGMIOS_URL` and `WS_OGMIOS_URL` are not set |         |             |
|           |    RPC_PORT     |                           The port the Cardano Ogmios node is running on                           |         |    1337     |
|           | IS_TLS_ENABLED  |      Flag to determine whether or not to use a TLS connection to connect to the Cardano node       |         |    false    |

---

## Ada-balance Endpoint

This endpoint fetches an address's balance and outputs it in Lovelace.

### Input Params

| Required? |    Name     |                                           Description                                           | Options | Defaults to |
| :-------: | :---------: | :---------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `addresses` | An array of addresses to query the balances for (this may also be under the 'result' parameter) |         |             |

`addresses` or `result` is an array of objects that contain the following information:

| Required? |   Name    |   Description    | Options | Defaults to |
| :-------: | :-------: | :--------------: | :-----: | :---------: |
|    ✅     | `address` | Address to query |         |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "addr_test1qz87tn9yat3xfutzds43tnj8qw457hk3v46w4028rtnx56v89wjwnrwcvlfm2atvcnnclh3x7thwrl7pgnffaw24mgws0dga4m"
      }
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
