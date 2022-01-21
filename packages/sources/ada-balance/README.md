# Chainlink External Adapter for Ada-balance

Version: 2.1.1

This adapter can be used to query Cardano address balances. The balance is queried from a Cardano node that has Ogmios running on top of it. Ogmios is a lightweight bridge interface that allows clients to query the Cardano node using JSON-RPC. More details can be found on their website https://ogmios.dev/.

The first two environment variable will take precedence over the others.

| Required? |      Name       |                                            Description                                             | Options | Defaults to |
| :-------: | :-------------: | :------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | HTTP_OGMIOS_URL |         The HTTP API endpoint of the Cardano node. Required if `WS_API_ENDPOINT` not set.          |         |             |
|           |  WS_OGMIOS_URL  |          The WS API endpoint of the Cardano node. Required if `WS_API_ENDPOINT` not set.           |         |             |
|           | WS_API_ENDPOINT | The WS host url of the Cardano node. Required if `HTTP_OGMIOS_URL` and `WS_OGMIOS_URL` are not set |         |             |
|           |    RPC_PORT     |                           The port the Cardano Ogmios node is running on                           |         |    1337     |
|           | IS_TLS_ENABLED  |      Flag to determine whether or not to use a TLS connection to connect to the Cardano node       |         |    false    |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases  |                 Description                 | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :-----------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to query balances for | array |         |         |            |                |

There are no examples for this endpoint.
